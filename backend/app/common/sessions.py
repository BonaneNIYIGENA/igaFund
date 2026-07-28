"""Session issuance and enforcement — idle timeout, revocation, concurrency cap."""
import uuid
from flask import request
from flask_jwt_extended import create_access_token, create_refresh_token

from ..extensions import db
from ..models import UserSession, Role

ADMIN_MAX_CONCURRENT_SESSIONS = 1


def issue_session(user):
    """Creates a session row and returns the access/refresh token pair for it.

    Admin accounts are capped at one concurrent session (§5.4): logging in
    again revokes every other session that account still holds, rather than
    letting old browser tabs or devices keep working silently.
    """
    if user.role == Role.ADMIN.value:
        UserSession.query.filter_by(user_id=user.id, revoked=False).update({"revoked": True})

    sid = uuid.uuid4().hex
    db.session.add(UserSession(
        sid=sid,
        user_id=user.id,
        ip_address=request.remote_addr,
        user_agent=(request.headers.get("User-Agent") or "")[:255],
    ))
    db.session.commit()

    claims = {"role": user.role, "sid": sid}
    return {
        "access": create_access_token(identity=str(user.id), additional_claims=claims),
        "refresh": create_refresh_token(identity=str(user.id), additional_claims=claims),
    }


def find_session(sid):
    if not sid:
        return None
    return UserSession.query.filter_by(sid=sid).first()


def is_session_blocked(sid):
    """True if this sid is missing, revoked, or has been idle past the timeout."""
    session = find_session(sid)
    if not session or session.revoked:
        return True
    if session.is_idle_expired():
        session.revoked = True
        db.session.commit()
        return True
    return False


def touch_session(sid):
    session = find_session(sid)
    if session and not session.revoked:
        session.touch()
        db.session.commit()


def revoke_session(sid):
    session = find_session(sid)
    if session:
        session.revoked = True
        db.session.commit()
