"""
S.T.A.R. Backend - PII Encryption Module
=========================================
Encrypts/decrypts sensitive devotee data (phone numbers, names) at rest
using Fernet symmetric encryption from the 'cryptography' library.

Key is stored in a file at %LOCALAPPDATA%/StarApp/encryption.key
"""

import os
import sys
from cryptography.fernet import Fernet


def get_key_path():
    """Get path to the encryption key file."""
    if sys.platform == "win32":
        base = os.environ.get("LOCALAPPDATA", os.path.expanduser("~"))
        key_dir = os.path.join(base, "StarApp")
    else:
        key_dir = os.path.join(os.path.expanduser("~"), ".starapp")
    
    os.makedirs(key_dir, exist_ok=True)
    return os.path.join(key_dir, "encryption.key")


def load_or_create_key():
    """Load the encryption key from file, or generate and save a new one."""
    key_path = get_key_path()
    
    if os.path.exists(key_path):
        with open(key_path, "rb") as f:
            key = f.read().strip()
        print(f"[CRYPTO] Loaded encryption key from: {key_path}")
    else:
        key = Fernet.generate_key()
        with open(key_path, "wb") as f:
            f.write(key)
        print(f"[CRYPTO] Generated new encryption key at: {key_path}")
    
    return key


# Initialize the Fernet cipher
_key = load_or_create_key()
_cipher = Fernet(_key)


def encrypt_field(value: str) -> str:
    """Encrypt a string field for storage at rest."""
    if not value:
        return value
    return _cipher.encrypt(value.encode('utf-8')).decode('utf-8')


def decrypt_field(value: str) -> str:
    """Decrypt an encrypted string field."""
    if not value:
        return value
    try:
        return _cipher.decrypt(value.encode('utf-8')).decode('utf-8')
    except Exception:
        # If decryption fails (e.g., data was stored unencrypted), return as-is
        return value


def encrypt_phone(phone: str) -> str:
    """Encrypt a phone number for storage."""
    return encrypt_field(phone)


def decrypt_phone(phone: str) -> str:
    """Decrypt a phone number for display."""
    return decrypt_field(phone)
