"""Transport and abuse protections applied to every response."""
import time
from collections import defaultdict, deque
from functools import wraps

from flask import request, jsonify, current_app
from werkzeug.middleware.proxy_fix import ProxyFix

# In-process counters. A multi-worker deployment should move this to Redis.
_attempts = defaultdict(deque)


def _client_key(scope):
    """Keys on the peer address only; a client-sent X-Forwarded-For is never trusted."""
    return f"{scope}:{request.remote_addr or 'unknown'}"


def rate_limit(scope, limit, window_seconds):
    """Rejects a caller that exceeds `limit` requests in a rolling window."""

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            if current_app.config.get("TESTING") and not current_app.config.get("RATE_LIMIT_IN_TESTS"):
                return fn(*args, **kwargs)

            key = _client_key(scope)
            now = time.monotonic()
            hits = _attempts[key]
            while hits and now - hits[0] > window_seconds:
                hits.popleft()

            if len(hits) >= limit:
                retry_after = int(window_seconds - (now - hits[0])) + 1
                response = jsonify({
                    "error": "Too many attempts. Wait a moment and try again.",
                    "code": "rate_limited",
                })
                response.status_code = 429
                response.headers["Retry-After"] = str(retry_after)
                return response

            hits.append(now)
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def clear_rate_limit(scope=None):
    """Called after a successful sign-in so one bad typo doesn't linger."""
    if scope is None:
        _attempts.clear()
        return
    _attempts.pop(_client_key(scope), None)


def register_security(app):
    # Forwarded headers are only believed for as many proxy hops as the operator
    # configured; the default of 0 means remote_addr stays the real peer.
    hops = app.config.get("TRUSTED_PROXY_HOPS", 0)
    if hops:
        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=hops, x_proto=hops, x_host=hops)

    @app.after_request
    def apply_headers(response):
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
        response.headers.setdefault("Cross-Origin-Resource-Policy", "same-site")
        if not app.config.get("DEBUG"):
            response.headers.setdefault(
                "Strict-Transport-Security", "max-age=31536000; includeSubDomains"
            )
        return response

    @app.errorhandler(429)
    def too_many(_):
        return jsonify({"error": "Too many attempts. Wait a moment and try again."}), 429

    @app.errorhandler(413)
    def too_large(_):
        return jsonify({"error": "That file is too large. The limit is 10 MB."}), 413

    @app.errorhandler(500)
    def server_error(_):
        # Never leak a stack trace or SQL fragment to the client.
        current_app.logger.exception("Unhandled server error")
        return jsonify({"error": "Something went wrong on our side. Try again."}), 500
