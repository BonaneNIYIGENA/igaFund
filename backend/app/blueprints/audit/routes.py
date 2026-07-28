import io
from datetime import datetime, timezone
from pathlib import Path
from flask import Blueprint, request, jsonify, send_file, current_app
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


@audit_bp.get("/export-pdf")
@role_required("admin")
def export_audit_pdf():
    """NFR4: a downloadable, printable copy of the full append-only audit trail."""
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors

    logs = AuditLog.query.order_by(AuditLog.created_at.desc()).all()

    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    forest = colors.HexColor("#12312A")
    sage = colors.HexColor("#6E8279")
    amber = colors.HexColor("#E8A13A")

    logo = Path(__file__).resolve().parents[3] / "frontend" / "public" / "logo.png"

    def draw_header():
        if logo.exists():
            try:
                c.drawImage(str(logo), 50, height - 74, width=40, height=40, mask="auto",
                            preserveAspectRatio=True)
            except Exception:
                current_app.logger.warning("Report logo could not be embedded")

        c.setFillColor(forest)
        c.setFont("Helvetica-Bold", 20)
        c.drawString(102, height - 52, "igaFund")
        c.setFont("Helvetica", 11)
        c.setFillColor(sage)
        c.drawString(102, height - 67, "Audit trail export")

        c.setStrokeColor(amber)
        c.setLineWidth(2)
        c.line(50, height - 84, width - 50, height - 84)

        c.setFillColor(sage)
        c.setFont("Helvetica", 9)
        c.drawString(50, height - 98,
                     f"Generated {datetime.now(timezone.utc).strftime('%d %B %Y at %H:%M UTC')} · {len(logs)} entries")

        c.setFillColor(forest)
        c.setFont("Helvetica-Bold", 8)
        headers = [("Time (UTC)", 50), ("Actor", 130), ("Action", 175), ("Target", 260), ("Note", 320), ("IP", 545)]
        y = height - 116
        for label, x in headers:
            c.drawString(x, y, label)
        c.setStrokeColor(sage)
        c.setLineWidth(0.5)
        c.line(50, y - 4, width - 50, y - 4)
        return y - 16

    y = draw_header()
    bottom_margin = 60

    for log in logs:
        if y < bottom_margin:
            c.showPage()
            y = draw_header()

        note = log.note or ""
        line1, line2 = (note, "") if len(note) <= 38 else (note[:38], note[38:76])

        c.setFont("Helvetica", 7.5)
        c.setFillColor(forest)
        c.drawString(50, y, log.created_at.strftime("%Y-%m-%d %H:%M") if log.created_at else "—")
        c.drawString(130, y, f"#{log.actor_id}")
        c.drawString(175, y, log.action.replace("_", " ")[:14])
        c.drawString(260, y, f"{log.target_type.replace('_', ' ')[:10]} #{log.target_id}")
        c.drawString(320, y, line1)
        c.setFillColor(sage)
        c.drawString(545, y, log.ip_address or "—")
        c.setFillColor(forest)

        if line2:
            y -= 10
            c.setFont("Helvetica", 7.5)
            c.drawString(320, y, line2 + ("…" if len(note) > 76 else ""))

        y -= 26

    c.setFillColor(sage)
    c.setFont("Helvetica-Oblique", 8)
    c.drawString(50, 40, "This export is an append-only record; entries here cannot be edited or deleted (BR9).")

    c.showPage()
    c.save()
    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"igaFund_AuditTrail_{datetime.now().strftime('%Y%m%d')}.pdf",
        mimetype="application/pdf",
    )
