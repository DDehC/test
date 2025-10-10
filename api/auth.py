from flask import Blueprint, request, jsonify, session
from bson import ObjectId
import bcrypt
from .. import db  # MongoDB instance from app factory

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

# -------------------
# Initial admin account setup
# -------------------

def ensure_admin_exists():
    """Ensure a default admin user exists in the database."""

    existing_admin = db.users.find_one({"username": "admin"})
    if not existing_admin:
        db.users.insert_one({
            "email": "admin@admin.com",
            "password_hash": hash_password("admin"),
            "username": "admin",
            "type": "admin",
            "department": "null",
            "active": "True",
            "must_change_password": False,
        })
        print("Default admin user created.")
    else:
        print("* Admin user already exists.")



# -------------------
# Role config
# -------------------

ALLOWED_TYPES = {"student", "staff", "admin", "publisher"}

def normalize_role(user_type: str) -> str:
    t = (user_type or "").lower()
    if t in {"student", "staff", "admin"}:
        return t
    if t == "publisher":
        return "staff"          # map legacy "publisher" to staff
    if t in {"user", "default", ""}:
        return "student"        # legacy default
    return "guest"

# -------------------
# Helpers
# -------------------

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def check_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))

def init_user_collection():
    """Ensure users collection exists and has required indexes."""
    if "users" not in db.list_collection_names():
        db.create_collection("users")
    db.users.create_index("username", unique=True)
    db.users.create_index("email", unique=True)

# -------------------
# Routes
# -------------------

@auth_bp.route("/test", methods=["GET"])
def test():
    return "Test!"

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    username   = data.get("username")
    email      = data.get("email")
    password   = data.get("password")
    user_type  = (data.get("type") or "student").lower()
    department = data.get("department")

    if not username or not email or not password:
        return jsonify({"success": False, "error": "Missing fields"}), 400
    if user_type not in ALLOWED_TYPES:
        return jsonify({"success": False, "error": "Invalid role"}), 400

    if db.users.find_one({"$or": [{"username": username}, {"email": email}]}):
        return jsonify({"success": False, "error": "User already exists"}), 400

    db.users.insert_one({
        "email": email,
        "password_hash": hash_password(password),
        "username": username,
        "type": user_type,
        "department": department,
        "active": True,
        "must_change_password": False,
    })
    return jsonify({"success": True, "message": "User registered successfully"}), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    email    = (data.get("email") or "").strip()
    password = data.get("password") or ""

    if not password or (not username and not email):
        return jsonify({"success": False, "error": "Missing fields"}), 400

    query = {"username": username} if username else {"email": email}
    user = db.users.find_one(query)
    if not user:
        return jsonify({"success": False, "error": "Invalid credentials"}), 401

    hashed = user.get("password_hash") or ""
    if not check_password(password, hashed):
        return jsonify({"success": False, "error": "Invalid credentials"}), 401

    if user.get("active") is False:
        return jsonify({"success": False, "error": "Account deactivated"}), 403

    # store raw type and normalized role in session
    session["user_id"]  = str(user["_id"])
    session["username"] = user["username"]
    session["type"]     = user.get("type", "student")
    session["email"] = user["email"]
    role = normalize_role(user.get("type"))
    session["role"]     = role

    return jsonify({
        "success": True,
        "role": role,  # convenience top-level
        "user": {
            "id":       str(user["_id"]),
            "username": user["username"],
            "email":    user.get("email"),
            "role":     role,
            "must_change_password": bool(user.get("must_change_password", False)),
        }
    }), 200

@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.pop("username", None)
    session.pop("type", None)
    session.pop("role", None)
    return jsonify({"success": True, "message": "Logged out"}), 200

@auth_bp.route("/me", methods=["GET"])
def me():
    u = session.get("username")
    t = session.get("type")
    if not u:
        return jsonify({"success": False, "error": "Unauthorized"}), 401
    return jsonify({
        "success": True,
        "user": {
            "username": u,
            "role": normalize_role(t),
        }
    }), 200

@auth_bp.route("/change_password", methods=["POST"])
def change_password():
    u = session.get("username")
    if not u:
        return jsonify({"success": False, "error": "Unauthorized"}), 401

    data = request.get_json(silent=True) or {}
    current = data.get("current_password") or ""
    newpwd  = data.get("new_password") or ""
    if len(newpwd) < 8:
        return jsonify({"success": False, "error": "Password too short"}), 400

    user = db.users.find_one({"username": u})
    if not user or not check_password(current, user.get("password_hash","")):
        return jsonify({"success": False, "error": "Invalid current password"}), 400

    db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {
            "password_hash": hash_password(newpwd),
            "must_change_password": False
        }}
    )
    return jsonify({"success": True, "message": "Password updated"}), 200

@auth_bp.route("/register_event", methods=["POST"])
def register_event():
    # 1) Auth: use server-side session (not localStorage)
    uid = session.get("user_id")
    if not uid:
        return jsonify({"success": False, "error": "Unauthorized"}), 401

    # 2) Validate input
    data = request.get_json(silent=True) or {}
    event_id = (data.get("event_id") or "").strip()
    if not event_id:
        return jsonify({"success": False, "error": "Missing event_id"}), 400

    # 3) Load user
    try:
        user = db.users.find_one({"_id": ObjectId(uid)})
    except Exception:
        return jsonify({"success": False, "error": "Invalid user id"}), 400
    if not user:
        return jsonify({"success": False, "error": "User not found"}), 404

    result = db.users.update_one(
        {"_id": user["_id"]},
        {"$addToSet": {"signups": {"event_id": event_id, "status": "attending"}}}
    )

    return jsonify({
        "success": True,
        "updated": bool(result.modified_count),
        "message": "Registered for event" if result.modified_count else "Already registered",
    }), 200

# -------- Legacy admin-like routes (kept for compatibility) --------

@auth_bp.route("/create_publisher", methods=["POST"])
def create_user():
    data = request.get_json(silent=True) or {}
    email      = data.get('email')
    password   = data.get('password')
    username   = data.get('username')
    user_type  = (data.get('type') or "").lower()
    department = data.get('department', None)

    if not email or not password or not username or not user_type:
        return jsonify({"success": False, "message": "Missing fields."}), 400
    if user_type not in ALLOWED_TYPES:
        return jsonify({"success": False, "message": "Invalid role specified."}), 400
    if user_type == 'publisher' and not department:
        return jsonify({"success": False, "message": "Department is required for publishers."}), 400
    if db.users.find_one({"$or": [{"email": email}, {"username": username}]}):
        return jsonify({"success": False, "message": "User already exists."}), 409

    db.users.insert_one({
        "email": email,
        "password_hash": hash_password(password),
        "username": username,
        "type": user_type,
        "department": department,
        "active": True,
        "must_change_password": True,
    })
    return jsonify({"success": True, "message": f"User '{email}' created successfully as a {user_type}."}), 201

@auth_bp.route("/delete_user/<string:username>", methods=["DELETE"])
def delete_user(username):
    user = db.users.find_one({"username": username})
    if not user:
        return jsonify({"success": False, "message": f"User '{username}' not found."}), 404
    db.users.delete_one({"username": username})
    return jsonify({"success": True, "message": f"User '{username}' deleted successfully."}), 200

@auth_bp.route("/update_user/<string:username>", methods=["PUT"])
def update_user(username):
    data = request.get_json(silent=True) or {}
    update_fields = {}

    if "email" in data:
        update_fields["email"] = data["email"]
    if "password" in data:
        update_fields["password_hash"] = hash_password(data["password"])
    if "username" in data:
        update_fields["username"] = data["username"]
    if "type" in data:
        new_type = (data.get("type") or "").lower()
        if new_type not in ALLOWED_TYPES:
            return jsonify({"success": False, "message": "Invalid role specified."}), 400
        update_fields["type"] = new_type
    if "department" in data:
        update_fields["department"] = data["department"]
    if "active" in data:
        update_fields["active"] = bool(data["active"])
    if "must_change_password" in data:
        update_fields["must_change_password"] = bool(data["must_change_password"])

    if not update_fields:
        return jsonify({"success": False, "message": "No valid fields to update."}), 400

    user = db.users.find_one({"username": username})
    if not user:
        return jsonify({"success": False, "message": f"User '{username}' not found."}), 404

    db.users.update_one({"username": username}, {"$set": update_fields})
    return jsonify({
        "success": True,
        "message": f"User '{username}' updated successfully.",
        "updated_fields": list(update_fields.keys())
    }), 200
