from flask import Blueprint

api_bp = Blueprint("api", __name__, url_prefix="/api")
admin_bp = Blueprint("admin", __name__, url_prefix="/admin")
email_bp = Blueprint("email", __name__, url_prefix="/email")
