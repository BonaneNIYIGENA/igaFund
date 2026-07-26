from flask import Blueprint, request, jsonify
from ...models import AuditLog
from ...common.decorators import role_required

audit_bp = Blueprint("audit", __name__)

@audit_bp.get("/")
@role_required("admin")
def list_audit_logs():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    pagination = AuditLog.query.order_by(AuditLog.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        "audit_logs": [log.to_dict() for log in pagination.items],
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": page
    }), 200
