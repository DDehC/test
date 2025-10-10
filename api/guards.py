from functools import wraps
from flask import session, jsonify

def _normalize_role(t: str) -> str:
    t = (t or "").lower()
    if t in {"student", "staff", "admin"}:
        return t
    if t == "publisher":
        return "staff"
    if t in {"user", "default", ""}:
        return "guest"
    return "guest"

def current_role() -> str:
    return _normalize_role(session.get("role") or session.get("type") or "")

def role_required(required: str):
    def deco(fn):
        @wraps(fn)
        def w(*a, **k):
            role = current_role()
            if role != required:
                return jsonify({"error": "forbidden", "message": "insufficient role",
                                "required": required, "role": role}), 403
            return fn(*a, **k)
        return w
    return deco

def roles_any(allowed):
    allowed_norm = {_normalize_role(r) for r in allowed}
    def deco(fn):
        @wraps(fn)
        def w(*a, **k):
            role = current_role()
            if role not in allowed_norm:
                return jsonify({"error": "forbidden", "message": "insufficient role",
                                "allowed": sorted(list(allowed_norm)), "role": role}), 403
            return fn(*a, **k)
        return w
    return deco
