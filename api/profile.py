# backend/routes/profile.py
from flask import Blueprint, request, jsonify, session
from .. import db

profile_bp = Blueprint("profile", __name__, url_prefix="/api/profile")

# ---- GET profile ----
@profile_bp.route("/", methods=["GET"])
def get_profile():
    u = session.get("username")
    if not u:
        return jsonify({"success": False, "error": "Unauthorized"}), 401

    user = db.users.find_one({"username": u})
    if not user:
        return jsonify({"success": False, "error": "User not found"}), 404

    print(f"DEBUG: Found user: {user.get('username')}")  # Debug log
    
    return jsonify({
        "success": True,
        "user": {
            "username": user.get("username"),
            "email": user.get("email"),
            "department": user.get("department"),
            "type": user.get("type"),
            "allergy": user.get("allergy", "none"),
        }
    }), 200

# ---- UPDATE profile ----
@profile_bp.route("/", methods=["POST"])
def update_profile():
    u = session.get("username")
    if not u:
        return jsonify({"success": False, "error": "Unauthorized"}), 401

    data = request.get_json(silent=True) or {}
    print(f"DEBUG: Update data received: {data}")  # Debug log
    
    allowed_fields = {"email", "allergy"}
    update_data = {k: v for k, v in data.items() if k in allowed_fields}

    if not update_data:
        return jsonify({"success": False, "error": "No valid fields provided"}), 400

    result = db.users.update_one({"username": u}, {"$set": update_data})
    
    updated = db.users.find_one({"username": u})
    return jsonify({
        "success": True,
        "user": {
            "username": updated.get("username"),
            "email": updated.get("email"),
            "department": updated.get("department"),
            "type": updated.get("type"),
            "allergy": updated.get("allergy", "none"),
        }
    }), 200

# Add a test endpoint to verify the blueprint is working
@profile_bp.route("/test", methods=["GET"])
def test_profile():
    return jsonify({"success": True, "message": "Profile endpoint is working!"}), 200