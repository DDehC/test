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

    msg = Message(
        subject=data.get("subject", "No subject"),
        recipients=[data["to"]],
        body=data["body"],
        sender=session.get("email"),
    )

    mail.send(msg)
    return jsonify({"message": "Email sent successfully"}), 200

# Tests

@email_bp.route("/test-send", methods=["POST"])
def test_send_endpoint():
    data = request.json
    sender = data.get("sender") or "admin@example.com"
    msg = Message(
        subject=data.get("subject"),
        recipients=[data["to"]],
        body=data.get("body"),
        sender=sender
    )
    mail.send(msg)
    return jsonify({"message": "Email sent successfully"}), 200

