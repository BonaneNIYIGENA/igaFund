"""Notification endpoints for all roles."""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from ...extensions import db
from ...models import Notification

notifications_bp = Blueprint("notifications", __name__)


@notifications_bp.get("/")
@jwt_required()
def list_notifications():
    uid = int(get_jwt_identity())
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)

    pagination = Notification.query.filter_by(user_id=uid).order_by(Notification.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    unread = Notification.query.filter_by(user_id=uid, read=False).count()
    
    return jsonify({
        "notifications": [n.to_dict() for n in pagination.items],
        "unread": unread,
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": page
    }), 200


@notifications_bp.post("/<int:nid>/read")
@jwt_required()
def mark_read(nid):
    uid = int(get_jwt_identity())
    note = db.session.get(Notification, nid)
    if not note or note.user_id != uid:
        return jsonify({"error": "Not found."}), 404
    note.read = True
    db.session.commit()
    return jsonify({"notification": note.to_dict()}), 200


@notifications_bp.post("/read-all")
@jwt_required()
def mark_all_read():
    uid = int(get_jwt_identity())
    Notification.query.filter_by(user_id=uid, read=False).update({"read": True})
    db.session.commit()
    return jsonify({"message": "All marked read."}), 200
