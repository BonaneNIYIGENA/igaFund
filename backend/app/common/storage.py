"""File storage."""
import hashlib
import os
import time
import uuid

from flask import current_app

try:
    import cloudinary
    import cloudinary.uploader
    import cloudinary.utils
    CLOUDINARY_AVAILABLE = True
except ImportError:
    CLOUDINARY_AVAILABLE = False


DOCUMENT_FOLDER = "igafund/documents"
PHOTO_FOLDER = "igafund/photos"
SIGNED_URL_TTL = 300


def is_cloud_enabled():
    cfg = current_app.config
    return bool(
        CLOUDINARY_AVAILABLE
        and cfg.get("CLOUDINARY_CLOUD_NAME")
        and cfg.get("CLOUDINARY_API_KEY")
        and cfg.get("CLOUDINARY_API_SECRET")
    )


def _configure():
    cfg = current_app.config
    cloudinary.config(
        cloud_name=cfg["CLOUDINARY_CLOUD_NAME"],
        api_key=cfg["CLOUDINARY_API_KEY"],
        api_secret=cfg["CLOUDINARY_API_SECRET"],
        secure=True,
    )


def _local_dir():
    path = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(path, exist_ok=True)
    return path


def upload_document(file_storage, ext, profile_id):
    """Stores a verification document."""
    if is_cloud_enabled():
        _configure()
        result = cloudinary.uploader.upload(
            file_storage,
            folder=f"{DOCUMENT_FOLDER}/{profile_id}",
            resource_type="raw" if ext == "pdf" else "image",
            type="authenticated",
            public_id=uuid.uuid4().hex,
            overwrite=False,
        )
        return result["secure_url"], result["public_id"]

    filename = f"{uuid.uuid4().hex}.{ext}"
    path = os.path.join(_local_dir(), filename)
    file_storage.save(path)
    return path, None


def upload_photo(file_storage, ext):
    """Stores a public profile photo."""
    if is_cloud_enabled():
        _configure()
        result = cloudinary.uploader.upload(
            file_storage,
            folder=PHOTO_FOLDER,
            resource_type="image",
            public_id=uuid.uuid4().hex,
            overwrite=False,
            transformation=[{"width": 600, "height": 600, "crop": "fill", "gravity": "face", "quality": "auto"}],
        )
        return result["secure_url"]

    filename = f"photo-{uuid.uuid4().hex}.{ext}"
    path = os.path.join(_local_dir(), filename)
    file_storage.save(path)
    return path


def signed_document_url(public_id, ext):
    """A short-lived signed link for a stored document."""
    if not is_cloud_enabled() or not public_id:
        return None
    _configure()
    url, _ = cloudinary.utils.cloudinary_url(
        public_id,
        resource_type="raw" if ext == "pdf" else "image",
        type="authenticated",
        sign_url=True,
        expires_at=int(time.time()) + SIGNED_URL_TTL,
    )
    return url


def delete_document(public_id, ext, local_path=None):
    """Removes a stored document from whichever backend holds it."""
    if public_id and is_cloud_enabled():
        _configure()
        try:
            cloudinary.uploader.destroy(
                public_id,
                resource_type="raw" if ext == "pdf" else "image",
                type="authenticated",
            )
        except Exception:
            current_app.logger.warning("Could not delete %s from Cloudinary", public_id)
        return

    if local_path and os.path.exists(local_path):
        os.remove(local_path)


def checksum(file_storage):
    """SHA-256 of the uploaded bytes, so a duplicate upload is detectable."""
    digest = hashlib.sha256()
    for chunk in iter(lambda: file_storage.stream.read(8192), b""):
        digest.update(chunk)
    file_storage.stream.seek(0)
    return digest.hexdigest()
