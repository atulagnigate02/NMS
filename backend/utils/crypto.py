from base64 import urlsafe_b64encode
from hashlib import sha256

from cryptography.fernet import Fernet

from backend.config.settings import get_settings


def _fernet() -> Fernet:
    key = get_settings().credential_encryption_key
    if not key:
        key = urlsafe_b64encode(sha256(get_settings().secret_key.encode()).digest()).decode()
    return Fernet(key.encode())


def encrypt_secret(value: str | None) -> str | None:
    if value is None:
        return None
    return _fernet().encrypt(value.encode()).decode()
