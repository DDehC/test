from flask import Blueprint, request, jsonify, session
import bcrypt
from .. import db  # MongoDB instance from app factory
from .. import mail
from flask_mail import Message
from datetime import datetime

email_bp = Blueprint("email", __name__, url_prefix="/api/email")

@email_bp.route("/send", methods=["POST"])
def send_email():
    data = request.json

    if not data or not data.get("to"):
        return jsonify({"message": "Missing fields"}), 400

    sender = session.get("email", "admin@example.com")
    recipient = data["to"]
    subject = data.get("subject", "Karlstad University Events - Publication Feedback")

    body = data.get("body", "")
    html = data.get("html")

    recipient_name = data.get("author", "Representative")
    event_title = data.get("subject", "Your Event Submission")
    feedback_message = data.get("body", "Thank you for your submission. We’ll review it shortly.")
    status = data.get("status", "Unreviewed")
    year = datetime.now().year

    if not html:
        html = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>KUE Feedback</title>
        </head>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; color: #333;">
          <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.05);">
            
            <!-- Header -->
            <div style="background-color: #fafafa; border-bottom: 1px solid #e5e7eb; text-align: center; padding: 20px;">
              <h1 style="margin: 0; font-size: 20px; color: #333;">Karlstad University Events (KUE)</h1>
            </div>
            
            <!-- Body -->
            <div style="padding: 30px 25px; line-height: 1.6;">
              <p style="margin-top: 0;">Dear {recipient_name},</p>

              <p>We have reviewed your recent publication request titled <strong>{event_title}</strong>.</p>

              <h2 style="font-size: 17px; color: #444;">Publication Status</h2>
              <div style="background-color: #e5e7eb; color: #111827; display: inline-block; padding: 6px 12px; border-radius: 6px; font-weight: 600;">
                {status}
              </div>

              <div style="background-color: #f9fafb; border-left: 4px solid #d1d5db; padding: 15px; margin: 20px 0; color: #4b5563; font-style: italic;">
                {feedback_message}
              </div>

              <p>If you have any further questions, please don’t hesitate to contact your appointed event coordinator.</p>

              <p style="margin-bottom: 0;">Best regards,<br>
              <strong>Karlstad University Events (KUE)</strong><br>
              Karlstad University<br> Appointed event coordiantor:
              <a href="mailto:{sender}" style="color: #2563eb; text-decoration: none;">{sender}</a></p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center; padding: 15px; font-size: 13px; color: #6b7280;">
              © {year} Karlstad University Events — All rights reserved.
            </div>
          </div>
        </body>
        </html>
        """

    msg = Message(
        subject=subject,
        recipients=[recipient],
        body=body,  # plain text fallback
        html=html,  # improved HTML template
        sender=session.get("email"),
    )

    mail.send(msg)
    return jsonify({"message": f"Email sent successfully to {recipient}"}), 200



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

