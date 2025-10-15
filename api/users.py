from flask import Blueprint, request, jsonify, session
from bson import ObjectId
from .. import db
from .auth import normalize_role, hash_password  # reuse helpers

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")

# ---------------- Guard whole blueprint with session/role ----------------

@admin_bp.before_request
def _require_admin_session():
    if request.method == "OPTIONS":
        return None  # allow CORS preflight
    u = session.get("username")
    t = session.get("type")
    if not u:
        return jsonify({"success": False, "message": "Unauthorized"}), 401
    if normalize_role(t) != "admin":
        return jsonify({
            "success": False,
            "error": "forbidden",
            "message": "insufficient role",
            "required": "admin",
            "role": normalize_role(t),
        }), 403

# ---------------- Helpers ----------------

STAFFLIKE_TYPES = {"staff", "publisher", "user"}  # legacy/stored values that map to staff

def _doc_to_item(doc):
    return {
        "id": str(doc["_id"]),
        "name": doc.get("username") or "",
        "email": doc.get("email") or "",
        "role": normalize_role(doc.get("type")),   # "staff" | "admin" | "student"
        "dept": doc.get("department") or "—",
        "active": bool(doc.get("active", True)),
        "allergy": doc.get("allergy", "none"),  # Added allergy part
    }

def _role_to_stored_type(role):
    r = (role or "").lower()
    if r == "admin":
        return "admin"
    if r == "staff":
        return "staff"   # treat legacy "publisher" as staff on read
    if r == "student":
        return "student"
    return "staff"

# ---------------- List users ----------------

@admin_bp.route("/users", methods=["GET"])
def list_users():
    q = (request.args.get("q") or "").strip()
    role = (request.args.get("role") or "").strip().lower()     # "staff" | "admin" | "student" | ""
    active = request.args.get("active")                          # "1" | "0" | None
    page = max(int(request.args.get("page", 1)), 1)
    page_size = min(max(int(request.args.get("page_size", 50)), 1), 200)

    filt = {}

    # role narrowing (optional)
    if role == "admin":
        filt["type"] = "admin"
    elif role == "staff":
        filt["type"] = {"$in": list(STAFFLIKE_TYPES)}            # staff/publisher/user
    elif role == "student":
        filt["type"] = "student"
    # else: no role filter → return all

    # active: treat missing as active
    if active == "1":
        filt.setdefault("$and", []).append({
            "$or": [{"active": True}, {"active": {"$exists": False}}]
        })
    elif active == "0":
        filt["active"] = False

    if q:
        regex = {"$regex": q, "$options": "i"}
        filt.setdefault("$and", []).append({
            "$or": [
                {"username": regex},
                {"email": regex},
                {"department": regex},
            ]
        })

    total = db.users.count_documents(filt)
    cursor = (
        db.users.find(filt)
        .sort([("_id", -1)])
        .skip((page - 1) * page_size)
        .limit(page_size)
    )
    items = [_doc_to_item(d) for d in cursor]
    return jsonify({"success": True, "items": items, "total": total, "page": page, "page_size": page_size}), 200

# ---------------- Create user ----------------

@admin_bp.post("/users")
def create_user():
    data = request.get_json(silent=True) or {}
    name   = (data.get("name") or "").strip()
    email  = (data.get("email") or "").strip().lower()
    role   = (data.get("role") or "staff").lower()     # "staff" | "admin" | "student"
    dept   = (data.get("dept") or "").strip() or None
    active = bool(data.get("active", True))
    allergy = data.get("allergy", None)  # Added allergy part

    if not name or not email:
        return jsonify({"success": False, "message": "name and email are required"}), 400

    # Validate allergy
    #if allergy not in ALLOWED_ALLERGIES:
     #   return jsonify({"success": False, "message": "Invalid allergy specified"}), 400

    # unique by email
    if db.users.find_one({"email": email}):
        return jsonify({"success": False, "message": "Email already exists"}), 409

    # default or explicit initial password
    initial_password = (data.get("password") or "strongpassword123")

    doc = {
        "username": name,
        "email": email,
        "type": _role_to_stored_type(role),
        "department": dept,
        "active": active,
        "allergy": allergy,  # Added allergy part
        "password_hash": hash_password(initial_password),
        "must_change_password": True,
        "signups": [
            {
            "event_id": "placeholder_ID",
            "status": "attending",
            }
        ]
    }

    ins = db.users.insert_one(doc)
    created = db.users.find_one({"_id": ins.inserted_id})
    return jsonify({"success": True, "item": _doc_to_item(created)}), 201

# ---------------- Update user ----------------

@admin_bp.put("/users/<string:user_id>")
def update_user(user_id):
    data = request.get_json(silent=True) or {}
    patch = {}

    if "name"   in data: patch["username"]   = (data.get("name") or "").strip()
    if "email"  in data: patch["email"]      = (data.get("email") or "").strip().lower()
    if "role"   in data: patch["type"]       = _role_to_stored_type(data.get("role"))
    if "dept"   in data: patch["department"] = (data.get("dept") or "").strip() or None
    if "active" in data: patch["active"]     = bool(data.get("active"))
    if "allergy" in data:  # Added allergy part
        allergy = data.get("allergy")
        patch["allergy"] = allergy
    if "password" in data and data.get("password"):
        patch["password_hash"] = hash_password(data.get("password"))

    if not patch:
        return jsonify({"success": False, "message": "No valid fields"}), 400

    try:
        oid = ObjectId(user_id)
    except Exception:
        return jsonify({"success": False, "message": "Invalid user id"}), 400

    res = db.users.update_one({"_id": oid}, {"$set": patch})
    if res.matched_count == 0:
        return jsonify({"success": False, "message": "Not found"}), 404

    doc = db.users.find_one({"_id": oid})
    return jsonify({"success": True, "item": _doc_to_item(doc)}), 200

# ---------------- Delete user ----------------

@admin_bp.delete("/users/<string:user_id>")
def delete_user(user_id):
    try:
        oid = ObjectId(user_id)
    except Exception:
        return jsonify({"success": False, "message": "Invalid user id"}), 400

    res = db.users.delete_one({"_id": oid})
    if res.deleted_count == 0:
        return jsonify({"success": False, "message": "Not found"}), 404

    return jsonify({"success": True}), 200