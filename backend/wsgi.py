"""Flask entrypoint for CLI and gunicorn."""
from app import create_app

app = create_app()
