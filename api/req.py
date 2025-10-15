# backend/routes/req.py

from flask import Blueprint, request, jsonify, send_file
from .. import db
from werkzeug.utils import secure_filename
from gridfs import GridFS
from gridfs.errors import NoFile
from .guards import roles_any

from datetime import datetime, timezone
import io, json, re
from bson import ObjectId

fs = GridFS(db)

req_bp = Blueprint("req", __name__, url_prefix="/api/req")

# -----------------------
# Helpers
# -----------------------

def _convert_objectids(obj):
    """Recursively convert ObjectId fields to strings for JSON serialization."""
    if isinstance(obj, list):
        return [_convert_objectids(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: _convert_objectids(v) for k, v in obj.items()}
    elif isinstance(obj, ObjectId):
        return str(obj)
    return obj

def _to_bool(v):
    if v is None:
        return False
    if isinstance(v, bool):
        return v
    s = str(v).strip().lower()
    return s in {"1", "true", "yes", "on"}

def _to_int_or_none(v):
    if v in (None, "", "null"):
        return None
    try:
        return int(v)
    except Exception:
        return None

# --- robust Stockholm TZ ---
try:
    from zoneinfo import ZoneInfo
    STHLM = ZoneInfo("Europe/Stockholm")
    
    _off_oct = STHLM.utcoffset(datetime(2025, 10, 23))
    _off_jan = STHLM.utcoffset(datetime(2025, 1, 23))
    assert str(_off_oct) in ("2:00:00", "2:00:00"), "Bad tzdata for Stockholm (expected +02:00)"
    assert str(_off_jan) in ("1:00:00", "1:00:00"), "Bad tzdata for Stockholm (expected +01:00)"
except Exception:
    # Fallback if tzdata is missing (Windows/minimal containers)
    try:
        from dateutil.tz import gettz
    except Exception:
        raise RuntimeError("Install python-dateutil or tzdata to handle timezones")
    STHLM = gettz("Europe/Stockholm")
    if STHLM is None:
        raise RuntimeError("Timezone 'Europe/Stockholm' unavailable")

def _combine_utc(date_str: str, hhmm: str | None) -> str | None:
    """
    Treat date_str + hhmm as LOCAL time in Europe/Stockholm,
    convert to UTC and return '...Z' ISO string.
    Accepts date_str as 'YYYY-MM-DD' or ISO; ignores time part if present.
    """
    s = (date_str or "").strip()
    if not s:
        return None
    if "T" in s:
        s = s.split("T", 1)[0]  # keep only date
    try:
        y, m, d = map(int, s.split("-"))
    except Exception:
        raise ValueError(f"Invalid date; expected 'YYYY-MM-DD' or ISO, got '{date_str}'")

    t = (hhmm or "").strip()
    if t:
        try:
            hh, mm = map(int, t.split(":"))
        except Exception:
            raise ValueError(f"Invalid time; expected 'HH:MM', got '{hhmm}'")
    else:
        hh, mm = 0, 0

    # Build LOCAL Stockholm datetime, then convert to UTC
    dt_local = datetime(y, m, d, hh, mm, tzinfo=STHLM)
    dt_utc = dt_local.astimezone(timezone.utc)
    return dt_utc.isoformat().replace("+00:00", "Z")

def _normalize_departments(raw):
    if raw is None:
        return {"type": "departments", "departments": []}
    if isinstance(raw, str):
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, dict) and "departments" in parsed:
                arr = parsed.get("departments") or []
            elif isinstance(parsed, list):
                arr = parsed
            else:
                arr = [str(parsed)]
            return {"type": "departments", "departments": arr}
        except json.JSONDecodeError:
            parts = [s.strip() for s in raw.split(",") if s.strip()]
            return {"type": "departments", "departments": parts}
    if isinstance(raw, list):
        return {"type": "departments", "departments": raw}
    if isinstance(raw, dict) and "departments" in raw:
        return {"type": "departments", "departments": list(raw.get("departments") or [])}
    return {"type": "departments", "departments": []}

# -----------------------
# Create publication request (multipart with files OR JSON)
# -----------------------

@req_bp.route("/pubreqtest", methods=["POST"])
def pubreqtest():
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    def build_doc(payload: dict, files_meta: list):
        title = payload.get("title")
        author = payload.get("author")
        organization = payload.get("organization")
        email = payload.get("email")
        description = payload.get("description")
        location = payload.get("_location") or payload.get("location")
        date = payload.get("date")  # "YYYY-MM-DD" or full ISO
        start_time = (payload.get("start_time") or "").strip()
        end_time = (payload.get("end_time") or "").strip() or start_time

        # Normalize timing (UTC ISO)
        if date:
            try:
                start_iso = _combine_utc(date, start_time)
                end_iso = _combine_utc(date, end_time)
            except ValueError as e:
                return None, {"success": False, "message": str(e)}, 400
            if end_iso < start_iso:
                return None, {"success": False, "message": "end_time < start_time"}, 400
        else:
            start_iso = None
            end_iso = None

        doc = {
            "title": title,
            "author": author,
            "organization": organization,
            "email": email,
            "location": location,
            "on_campus": _to_bool(payload.get("on_campus")),
            "max_attendees": _to_int_or_none(payload.get("max_attendees")),

            # raw timing (as submitted)
            "date": date,
            "start_time": start_time,
            "end_time": end_time,

            # normalized timing (UTC)
            "start_iso": start_iso,
            "end_iso": end_iso,

            "description": description,
            "publish_all": _to_bool(payload.get("publish_all")),
            "departments": _normalize_departments(payload.get("departments")),
            "attachments": files_meta,

            # workflow + visibility
            "status": "pending",      # pending | approved | rejected
            "is_visible": False,      # drives calendar display

            "created_at": now,
            "updated_at": now,
        }
        return doc, None, None

    # multipart/form-data
    if request.content_type and request.content_type.startswith("multipart/form-data"):
        files = request.files.getlist("attachments")
        saved_files = []
        for f in files:
            if not f or f.filename == "":
                continue
            file_id = fs.put(f, filename=secure_filename(f.filename), content_type=f.content_type)
            saved_files.append({
                "file_id": str(file_id),
                "filename": f.filename,
                "mime": f.content_type
            })

        doc, err_payload, err_code = build_doc(request.form, saved_files)
        if doc is None:
            return jsonify(err_payload), err_code

        res = db.pub_req.insert_one(doc)
        doc["_id"] = str(res.inserted_id)
        return jsonify({"success": True, "message": "Publication added with files", "publication": doc}), 201

    # JSON body
    data = (request.get_json(silent=True) or {})
    if not data:
        return jsonify({"success": False, "message": "No data provided"}), 400

    doc, err_payload, err_code = build_doc(data, [])
    if doc is None:
        return jsonify(err_payload), err_code

    res = db.pub_req.insert_one(doc)
    doc["_id"] = str(res.inserted_id)
    return jsonify({"success": True, "message": "Publication added", "publication": doc}), 201

# -----------------------
# Fetch requests (with filters + pagination)
# -----------------------

@req_bp.route("/pubreqfetch", methods=["GET"])
@roles_any({"staff", "admin"})
def pubreqfetch():
    try:
        dept      = request.args.get("dept")
        status    = request.args.get("status")
        q         = request.args.get("q")
        page      = int(request.args.get("page", "1"))
        page_size = max(min(int(request.args.get("page_size", "50")), 200), 1)

        filt = {}
        or_clauses = []

        if dept and dept != "all":
            or_clauses.extend([
                {"departments": dept},
                {"departments.departments": dept},
            ])

        if q:
            try:
                regex = re.compile(q, re.IGNORECASE)
            except re.error as e:
                return jsonify({"error": "bad_request", "message": f"invalid query regex: {e}"}), 400
            or_clauses.extend([
                {"title": regex},
                {"author": regex},
                {"email": regex},
                {"organization": regex},
                {"location": regex},
                {"description": regex},
            ])

        if or_clauses:
            filt["$or"] = or_clauses

        if status and status != "all":
            filt["status"] = status.strip().lower()

        cursor = (
            db.pub_req.find(filt)
            .sort([("start_iso", -1), ("_id", -1)])
            .skip((page - 1) * page_size)
            .limit(page_size)
        )

        items = []
        for doc in cursor:
            # departments → array
            departments = []
            d = doc.get("departments")
            if isinstance(d, dict):
                departments = d.get("departments", []) or []
            elif isinstance(d, list):
                departments = d
            elif isinstance(d, str):
                try:
                    parsed = json.loads(d)
                    if isinstance(parsed, dict):
                        departments = parsed.get("departments", []) or []
                    elif isinstance(parsed, list):
                        departments = parsed
                except json.JSONDecodeError:
                    departments = []

            # attachments → add URLs
            attachments = []
            for f in (doc.get("attachments") or []):
                if isinstance(f, dict) and f.get("file_id"):
                    attachments.append({
                        "file_id": f.get("file_id"),
                        "filename": f.get("filename"),
                        "mime": f.get("mime"),
                        "url": f"/api/req/attachments/{f.get('file_id')}",
                    })

            items.append({
                "id": str(doc.get("_id")),
                "title": doc.get("title", ""),
                "author": doc.get("author", ""),
                "email": doc.get("email", ""),
                "organization": doc.get("organization", ""),
                "location": doc.get("location", ""),
                "description": doc.get("description", ""),

                # timing (raw + normalized)
                "date": doc.get("date", ""),
                "start_time": doc.get("start_time", ""),
                "end_time": doc.get("end_time", ""),
                "start_iso": doc.get("start_iso"),
                "end_iso": doc.get("end_iso"),

                # flags
                "on_campus": bool(doc.get("on_campus", False)),
                "max_attendees": doc.get("max_attendees"),
                "publish_all": bool(doc.get("publish_all", False)),
                "is_visible": bool(doc.get("is_visible", False)),
                "status": doc.get("status", "pending"),

                "departments": departments,
                "attachments": attachments,

                # audit
                "created_at": doc.get("created_at"),
                "updated_at": doc.get("updated_at"),
            })

        total = db.pub_req.count_documents(filt)
        return jsonify({"items": items, "total": total, "page": page, "page_size": page_size}), 200

    except ValueError:
        return jsonify({"error": "bad_request", "message": "page and page_size must be integers"}), 400
    except Exception as e:
        return jsonify({"error": "server_error", "message": str(e)}), 500

# -----------------------
# Serve attachment by file_id
# -----------------------

@req_bp.route("/attachments/<string:file_id>")
def get_attachment(file_id):
    try:
        grid_out = fs.get(ObjectId(file_id))
        return send_file(
            io.BytesIO(grid_out.read()),
            download_name=grid_out.filename,
            mimetype=grid_out.content_type,
            as_attachment=False,
        )
    except NoFile:
        return {"success": False, "message": "File not found"}, 404

# -----------------------
# Change status (+ visibility toggle)
# -----------------------

@req_bp.route("/pubreqchangestatus", methods=["POST"])
@roles_any({"staff", "admin"})
def pubreqchangestatus():
    data = request.get_json(silent=True) or {}
    id_str = data.get("id")

    status = (data.get("status") or "").strip().lower()
    if status == "denied":
        status = "rejected"

    if not id_str or status not in {"pending", "approved", "rejected"}:
        return jsonify({"success": False, "message": "id and valid status required"}), 400

    try:
        oid = ObjectId(id_str)
    except Exception:
        return jsonify({"success": False, "message": "invalid id"}), 400

    is_visible = (status == "approved")
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    upd = {
        "status": status,
        "is_visible": is_visible,
        "updated_at": now,
    }
    if "feedback" in data:
        upd["feedback"] = data.get("feedback")

    db.pub_req.find_one_and_update({"_id": oid}, {"$set": upd})
    return jsonify({"success": True, "status": status, "is_visible": is_visible}), 200

@req_bp.route("/pubreqdelete", methods=["POST"])
@roles_any({"staff", "admin"})
def pubreqdelete():
    data = request.get_json(silent=True) or {}
    id_str = (data.get("id") or "").strip()
    if not id_str:
        return jsonify({"success": False, "message": "missing id"}), 400

    try:
        oid = ObjectId(id_str)
    except Exception:
        return jsonify({"success": False, "message": "invalid id"}), 400

    # best-effort remove of any stored files
    try:
        doc = db.pub_req.find_one({"_id": oid}) or {}
        for att in (doc.get("attachments") or []):
            fid = att.get("file_id") or att.get("_id") or att.get("id")
            if not fid:
                continue
            try:
                fs.delete(ObjectId(fid))
            except Exception:
                pass
    except Exception:
        pass

    res = db.pub_req.delete_one({"_id": oid})
    if res.deleted_count != 1:
        return jsonify({"success": False, "message": "not found"}), 404

    return jsonify({"success": True, "deleted": 1}), 200

@req_bp.route("/pubrequpdate", methods=["POST"])
@roles_any({"staff", "admin"})
def pubreq_update():
    """
    Update an existing publication request.
    Expects JSON:
      { id: str, title?, author?, organization?, email?, location?, date?, start_time?, end_time?,
        max_attendees?, description?, publish_all?, departments? }
    Returns the updated request.
    """
    data = request.get_json(silent=True) or {}
    req_id = data.get("id")
    if not req_id:
        return jsonify({"success": False, "message": "id is required"}), 400

    try:
        oid = ObjectId(req_id)
    except Exception:
        return jsonify({"success": False, "message": "invalid id"}), 400

    doc = db.pub_req.find_one({"_id": oid})
    if not doc:
        return jsonify({"success": False, "message": "Request not found"}), 404

    upd = {}
    for field in ["title", "author", "organization", "email", "location", "description", "publish_all", "max_attendees"]:
        if field in data:
            if field == "max_attendees":
                upd[field] = _to_int_or_none(data[field])
            elif field == "publish_all":
                upd[field] = _to_bool(data[field])
            else:
                upd[field] = data[field]

    if "departments" in data:
        upd["departments"] = _normalize_departments(data["departments"])

    if "date" in data:
        start_time = data.get("start_time") or ""
        end_time = data.get("end_time") or start_time
        upd["date"] = data["date"]
        upd["start_time"] = start_time
        upd["end_time"] = end_time
        try:
            upd["start_iso"] = _combine_utc(data["date"], start_time)
            upd["end_iso"] = _combine_utc(data["date"], end_time)
            if upd["end_iso"] < upd["start_iso"]:
                return jsonify({"success": False, "message": "end_time < start_time"}), 400
        except ValueError as e:
            return jsonify({"success": False, "message": str(e)}), 400

    upd["updated_at"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    db.pub_req.find_one_and_update({"_id": oid}, {"$set": upd})

    updated = db.pub_req.find_one({"_id": oid})

    deps = updated.get("departments")
    if isinstance(deps, dict):
        updated["departments"] = deps.get("departments", []) or []
    elif isinstance(deps, list):
        updated["departments"] = deps
    else:
        updated["departments"] = []

    updated = _convert_objectids(updated)

    return jsonify({"success": True, "message": "Request updated", "publication": updated}), 200

@req_bp.route("/eventcreate", methods=["POST"])
@roles_any({"staff", "admin"})
def event_create():
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    def build_doc(payload: dict, files_meta: list):
        # Copy attachments through if present (both branches can use it)
        attachments = payload.get("attachments") or files_meta or []

        title = payload.get("title")
        organization = payload.get("organization")
        description = payload.get("description")
        location = payload.get("_location") or payload.get("location")
        date = payload.get("date")  # "YYYY-MM-DD" or full ISO
        start_time = (payload.get("start_time") or "").strip()
        end_time = (payload.get("end_time") or "").strip() or start_time

        # Normalize timing (UTC ISO)
        if date:
            try:
                start_iso = _combine_utc(date, start_time)
                end_iso = _combine_utc(date, end_time)
            except ValueError as e:
                return None, {"success": False, "message": str(e)}, 400
            if end_iso < start_iso:
                return None, {"success": False, "message": "end_time < start_time"}, 400
        else:
            start_iso = None
            end_iso = None

        doc = {
            "title": title,
            "organization": organization,
            "location": location,
            "on_campus": _to_bool(payload.get("on_campus")),
            "max_attendees": _to_int_or_none(payload.get("max_attendees")),

            # raw timing (as submitted)
            "date": date,
            "start_time": start_time,
            "end_time": end_time,

            # normalized timing (UTC)
            "start_iso": start_iso,
            "end_iso": end_iso,

            "description": description,
            "publish_all": _to_bool(payload.get("publish_all")),
            "departments": _normalize_departments(payload.get("departments")),
            "attachments": attachments,
            "created_at": now,
        }
        return doc, None, None

    data = (request.get_json(silent=True) or {})
    if not data:
        return jsonify({"success": False, "message": "No data provided"}), 400

    # If caller sends { id }, build from pub_req; else fall back to current JSON-as-payload behavior
    req_id = data.get("id")
    if req_id:
        try:
            oid = ObjectId(req_id)
        except Exception:
            return jsonify({"success": False, "message": "Invalid id"}), 400

        src = db.pub_req.find_one({"_id": oid})
        if not src:
            return jsonify({"success": False, "message": "Request not found"}), 404

        # Optional: enforce status
        if src.get("status") != "approved":
            return jsonify({"success": False, "message": "Request must be approved first"}), 409

        # Build event from source request (ignore client fields except the id)
        doc, err_payload, err_code = build_doc(src, src.get("attachments") or [])
        if doc is None:
            return jsonify(err_payload), err_code

        # Idempotency: ensure one event per request
        # (Create this unique index once in setup: db.events.create_index("source_request_id", unique=True))
        doc["source_request_id"] = src["_id"]

        try:
            res = db.events.insert_one(doc)
            event_id = res.inserted_id
        except Exception as e:
            # If duplicate, fetch existing
            existing = db.events.find_one({"source_request_id": src["_id"]}, {"_id": 1})
            if not existing:
                return jsonify({"success": False, "message": str(e)}), 500
            event_id = existing["_id"]

        # Link back to the request
        db.pub_req.update_one(
            {"_id": src["_id"]},
            {"$set": {"event_id": event_id, "processed_at": now}}
        )

        doc["_id"] = str(event_id)
        doc["source_request_id"] = str(src["_id"])
        return jsonify({"success": True, "message": "Event created from request", "event": doc}), 201

@req_bp.route("/eventdelete", methods=["POST"])
@roles_any({"staff", "admin"})
def event_delete():
    """
    Deletes an event document from db.events using its source_request_id.
    Requires role: staff or admin.
    Expected JSON body: { "source_request_id": "<request_id>" }
    """

    data = request.get_json(silent=True) or {}
    src_id = data.get("source_request_id")

    if not src_id:
        return jsonify({"success": False, "message": "Missing source_request_id"}), 400

    try:
        oid = ObjectId(src_id)
    except Exception:
        return jsonify({"success": False, "message": "Invalid source_request_id"}), 400

    # Try to delete the event tied to that source_request_id
    res = db.events.delete_one({"source_request_id": oid})

    if res.deleted_count == 0:
        return jsonify({"success": False, "message": "No event found for that source_request_id"}), 404

    # Optionally, also unlink it from pub_req (if your schema links them)
    db.pub_req.update_one(
        {"_id": oid},
        {"$unset": {"event_id": ""}}
    )

    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    return jsonify({
        "success": True,
        "message": f"Event deleted successfully at {now}",
        "deleted_source_request_id": src_id
    }), 200

@req_bp.route("/eventfetch", methods=["GET"])
def event_fetch():
    """
    Query params:
      start=YYYY-MM-DD  inclusive at 00:00Z
      end=YYYY-MM-DD    exclusive at 00:00Z (use next day)
    Returns events where [start_iso, end_iso) overlaps [start, end)
    Only status=approved and is_visible=true.
    """
    start = (request.args.get("start") or "").strip()
    end   = (request.args.get("end") or "").strip()
    if not start or not end:
        return jsonify({"success": False, "message": "start and end required (YYYY-MM-DD)"}), 400

    try:
        # build UTC ISO range
        s_year, s_mon, s_day = map(int, start.split("-"))
        e_year, e_mon, e_day = map(int, end.split("-"))

        s_iso = datetime(s_year, s_mon, s_day, 0, 0, tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")
        e_iso = datetime(e_year, e_mon, e_day, 0, 0, tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")
    except Exception:
        return jsonify({"success": False, "message": "invalid start/end format"}), 400

    # overlap test: event.start < range_end AND event.end > range_start
    filt = {
        "start_iso": {"$lt": e_iso},
        "end_iso":   {"$gt": s_iso},
    }

    # projection
    cur = db.events.find(filt, {
        "_id": 1, "title": 1, "description": 1,
        "start_iso": 1, "end_iso": 1,
        "location": 1, "on_campus": 1,
        "departments": 1,
        "max_attendees": 1,
    }).sort([("start_iso", 1)])

    items = []
    for d in cur:
        # normalize departments array
        deps = []
        raw = d.get("departments")
        if isinstance(raw, dict):
            deps = raw.get("departments", []) or []
        elif isinstance(raw, list):
            deps = raw
        elif isinstance(raw, str):
            try:
                p = json.loads(raw); deps = (p.get("departments") if isinstance(p, dict) else p) or []
            except json.JSONDecodeError:
                deps = []

        items.append({
            "id": str(d["_id"]),
            "title": d.get("title", ""),
            "start": d.get("start_iso"),    # ISO string
            "end":   d.get("end_iso"),
            "location": d.get("location", ""),
            "on_campus": bool(d.get("on_campus", False)),
            "description": d.get("description", ""),
            "departments": deps,
            "max_attendees": d.get("max_attendees"),
        })

    return jsonify({"success": True, "items": items})

@req_bp.route("/calendar", methods=["GET"])
def calendar_range():
    """
    Query params:
      start=YYYY-MM-DD  inclusive at 00:00Z
      end=YYYY-MM-DD    exclusive at 00:00Z (use next day)
    Returns events where [start_iso, end_iso) overlaps [start, end)
    Only status=approved and is_visible=true.
    """
    start = (request.args.get("start") or "").strip()
    end   = (request.args.get("end") or "").strip()
    if not start or not end:
        return jsonify({"success": False, "message": "start and end required (YYYY-MM-DD)"}), 400

    try:
        # build UTC ISO range
        s_year, s_mon, s_day = map(int, start.split("-"))
        e_year, e_mon, e_day = map(int, end.split("-"))

        s_iso = datetime(s_year, s_mon, s_day, 0, 0, tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")
        e_iso = datetime(e_year, e_mon, e_day, 0, 0, tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")
    except Exception:
        return jsonify({"success": False, "message": "invalid start/end format"}), 400

    # overlap test: event.start < range_end AND event.end > range_start
    filt = {
        "start_iso": {"$lt": e_iso},
        "end_iso":   {"$gt": s_iso},
    }

    # projection
    cur = db.events.find(filt, {
        "_id": 1, "title": 1, "description": 1,
        "start_iso": 1, "end_iso": 1,
        "location": 1, "on_campus": 1,
        "departments": 1,
        "max_attendees": 1,
    }).sort([("start_iso", 1)])

    items = []
    for d in cur:
        # normalize departments array
        deps = []
        raw = d.get("departments")
        if isinstance(raw, dict):
            deps = raw.get("departments", []) or []
        elif isinstance(raw, list):
            deps = raw
        elif isinstance(raw, str):
            try:
                p = json.loads(raw); deps = (p.get("departments") if isinstance(p, dict) else p) or []
            except json.JSONDecodeError:
                deps = []

        items.append({
            "id": str(d["_id"]),
            "title": d.get("title", ""),
            "start": d.get("start_iso"),    # ISO string
            "end":   d.get("end_iso"),
            "location": d.get("location", ""),
            "on_campus": bool(d.get("on_campus", False)),
            "description": d.get("description", ""),
            "departments": deps,
            "max_attendees": d.get("max_attendees"),
        })

    return jsonify({"success": True, "items": items})

