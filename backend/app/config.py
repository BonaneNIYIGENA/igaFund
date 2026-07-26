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


class DevConfig(BaseConfig):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "sqlite:///igafund_dev.db")


class ProdConfig(BaseConfig):
    DEBUG = False
    # normalise heroku-style scheme so SQLAlchemy accepts it
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "").replace("postgres://", "postgresql://", 1)


class TestConfig(BaseConfig):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    BCRYPT_LOG_ROUNDS = 4


config_map = {"dev": DevConfig, "prod": ProdConfig, "test": TestConfig}
