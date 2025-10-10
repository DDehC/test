import redis
import flask, flask_session
from flask_cors import CORS
import pymongo
import bcrypt
from flask import request, session, jsonify
from flask_mail import Mail
#from backend.routes.profile import profile_bp

mail = Mail()
mongo = pymongo.MongoClient(host='mongo:27017')
db = mongo.mydb

def create_app():

    print("Flask is running!")

    SESSION_TYPE = 'redis'
    DEBUG = True

    app = flask.Flask(__name__)
    app.config['DEBUG'] = DEBUG
    app.config['SESSION_TYPE'] = 'redis'
    app.config['SESSION_REDIS'] = redis.Redis(host='redis', port=6379, db=0)

    app.config['MAIL_SERVER'] = 'mailhog'  # must match the docker service name
    app.config['MAIL_PORT'] = 1025
    app.config['MAIL_USE_TLS'] = False
    app.config['MAIL_USE_SSL'] = False
    app.config['MAIL_USERNAME'] = 'admin'
    app.config['MAIL_PASSWORD'] = 'admin'

    mail.init_app(app)

    @app.route("/ping")
    def ping():
        return "pong", 200

    CORS(app, supports_credentials=True)

    if DEBUG:
        app.config['TEMPLATES_AUTO_RELOAD'] = True
    flask_session.Session(app)

    # --- BEGIN: role guard (authoritative; minimal intrusion) ---
    PROTECTED_PREFIXES = {"student", "staff", "admin"}
    SKIP_PREFIXES = {"api", "auth", "req", "users", "ping", "static", ""}

    def _normalize_role(user_type: str) -> str:
        t = (user_type or "").lower()
        if t in {"student", "staff", "admin"}:
            return t
        if t == "publisher":
            return "staff"  # mirror auth.normalize_role
        if t in {"user", "default", ""}:
            return "student"
        return "guest"

    @app.before_request
    def _enforce_role_on_prefix():
        if request.method == "OPTIONS":
            return None
        path = (request.path or "/").lstrip("/")
        first = path.split("/", 1)[0].lower()
        if first in SKIP_PREFIXES:
            return None
        if first in PROTECTED_PREFIXES:
            user_role = _normalize_role(session.get("role") or session.get("type") or "")
            if user_role != first:
                return jsonify({
                    "error": "forbidden",
                    "message": "insufficient role",
                    "required": first,
                    "role": user_role
                }), 403
        return None
    # --- END: role guard ---

    # START Api routes
    from .api import api_bp
    app.register_blueprint(api_bp)

    from .api.auth import auth_bp
    app.register_blueprint(auth_bp)

    from .api.req import req_bp
    app.register_blueprint(req_bp)

    from .api.users import admin_bp
    app.register_blueprint(admin_bp)

    from .api.auth import ensure_admin_exists

    from .api.email import email_bp
    app.register_blueprint(email_bp)

    from .api.profile import profile_bp
    app.register_blueprint(profile_bp)

    with app.app_context():
        ensure_admin_exists()
    # END Api routes


    if __name__ == '__main__':
        app.run(debug=True, host='0.0.0.0', port=5050)
    return app
