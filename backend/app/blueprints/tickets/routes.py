"""Tickets blueprint — retrieve & generate official process tickets."""
import json
import uuid
from datetime import datetime, timezone
from flask import Blueprint, jsonify

from ...extensions import db
from ...models import Ticket, Role
from ...common.decorators import role_required

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
@role_required(Role.ADMIN.value)
def list_tickets():
    """The official process record. Admin-only — students and donors get
    their own progress and receipt views instead, built from live data."""
    tickets = Ticket.query.order_by(Ticket.created_at.desc()).all()
    return jsonify({"tickets": [t.to_dict() for t in tickets]}), 200
