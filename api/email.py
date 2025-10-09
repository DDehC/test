from flask import Blueprint, request, jsonify, session
import bcrypt
from .. import db  # MongoDB instance from app factory
from .. import mail
from flask_mail import Message

email_bp = Blueprint("email", __name__, url_prefix="/api/email")

@email_bp.route("/send", methods=["POST"])
def send_email():
    data = request.json
    if not data or not data.get("to") or not data.get("body"):
        return jsonify({"message": "Missing fields"}), 400

    user_email = session.get("email") or "admin@example.com"

    msg = Message(
        subject=data.get("subject", "No subject"),
        recipients=[data["to"]],
        body=data["body"],
        sender=user_email,
    )

    mail.send(msg)
    return jsonify({"message": "Email sent successfully"}), 200
