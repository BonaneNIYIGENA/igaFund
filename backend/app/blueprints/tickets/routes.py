"""Tickets blueprint — retrieve & generate official process tickets."""
import json
import uuid
from datetime import datetime, timezone
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

from ...extensions import db
from ...models import Ticket, User, Role

tickets_bp = Blueprint("tickets", __name__)


def generate_ticket_number(prefix="TICK"):
    now_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    short_id = uuid.uuid4().hex[:6].upper()
    return f"{prefix}-{now_str}-{short_id}"


def create_process_ticket(user_id, process_type, title, summary, details=None):
    """Helper function to issue an official process ticket."""
    ticket_num = generate_ticket_number()
    t = Ticket(
        ticket_number=ticket_num,
        user_id=user_id,
        process_type=process_type,
        title=title,
        summary=summary,
        details_json=json.dumps(details) if details else None,
    )
    db.session.add(t)
    db.session.commit()
    return t


@tickets_bp.get("/")
@jwt_required()
def list_tickets():
    """Fetch tickets for the logged in user or all for admin."""
    uid = int(get_jwt_identity())
    role = get_jwt().get("role")

    if role == Role.ADMIN.value:
        tickets = Ticket.query.order_by(Ticket.created_at.desc()).all()
    else:
        tickets = Ticket.query.filter_by(user_id=uid).order_by(Ticket.created_at.desc()).all()

    return jsonify({"tickets": [t.to_dict() for t in tickets]}), 200
