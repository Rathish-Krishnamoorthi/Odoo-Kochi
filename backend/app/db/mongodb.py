from uuid import uuid4

from pymongo import MongoClient
from pydantic import EmailStr, TypeAdapter, ValidationError

from app.core.config import settings
from app.core.security import hash_password

_client = None


def connect_database():
    """Create the process-wide Mongo client (PyMongo pools connections)."""
    global _client
    if _client is None:
        _client = MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=3000)
    return _client.get_default_database()


def close_database():
    global _client
    if _client is not None:
        _client.close()
        _client = None


def ensure_indexes(database):
    database.users.create_index("email", unique=True)
    database.customers.create_index("email", unique=True)
    database.subscriptions.create_index("subscription_number", unique=True)
    database.invoices.create_index("invoice_number", unique=True)
    database.quotations.create_index("quotation_number", unique=True)
    database.invoices.create_index("quotation_id", unique=True, sparse=True)
    database.payments.create_index("reference", unique=True, sparse=True)


def ensure_initial_admin(database):
    email, password = settings.initial_admin_email, settings.initial_admin_password
    if not email and not password:
        return
    if not email or not password:
        raise ValueError("Both INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD are required.")
    if database.users.count_documents({"role": "admin"}) > 0:
        return
    try:
        email = str(TypeAdapter(EmailStr).validate_python(email)).lower()
    except ValidationError as exc:
        raise ValueError("INITIAL_ADMIN_EMAIL must be a valid email address.") from exc
    if database.users.find_one({"email": email}):
        raise ValueError("Initial administrator email already belongs to a non-admin account.")
    database.users.insert_one({
        "id": "admin-" + uuid4().hex,
        "name": "Administrator",
        "email": email,
        "role": "admin",
        "status": "active",
        "password_hash": hash_password(password),
    })


def get_database():
    """Compatibility helper; the singleton client is never created per request."""
    return connect_database()
