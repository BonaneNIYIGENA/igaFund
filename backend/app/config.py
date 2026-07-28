"""Environment configs."""
import os
from pathlib import Path
from datetime import timedelta


class BaseConfig:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me-please-32bytes-min")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-change-me-please-32bytes-minimum")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    BCRYPT_LOG_ROUNDS = 12
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10 MB
    UPLOAD_FOLDER = str(Path(__file__).resolve().parent.parent / "uploads")
    ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg"}
    ALLOWED_MIMETYPES = {"application/pdf", "image/png", "image/jpeg"}
    CORS_ORIGINS = ["*"]

    # Cloudinary holds uploads; the database stores only the returned link.
    CLOUDINARY_CLOUD_NAME = os.environ.get("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY = os.environ.get("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET = os.environ.get("CLOUDINARY_API_SECRET", "")


class DevConfig(BaseConfig):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "sqlite:///igafund_dev.db")
    CORS_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173"]


class ProdConfig(BaseConfig):
    DEBUG = False
    # normalise heroku-style scheme so SQLAlchemy accepts it
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "").replace("postgres://", "postgresql://", 1)
    # Same-origin in production; set explicit hosts only if the SPA is served elsewhere.
    CORS_ORIGINS = [o for o in os.environ.get("CORS_ORIGINS", "").split(",") if o]
    SESSION_COOKIE_SECURE = True
    PREFERRED_URL_SCHEME = "https"


class TestConfig(BaseConfig):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    BCRYPT_LOG_ROUNDS = 4
    CORS_ORIGINS = ["*"]


config_map = {"dev": DevConfig, "prod": ProdConfig, "test": TestConfig}
