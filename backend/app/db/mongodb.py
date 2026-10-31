from pymongo import MongoClient

from app.core.config import settings


def get_database():
    client = MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=2000)
    return client.get_default_database()


def ensure_indexes(database):
    database.users.create_index("email", unique=True)
    database.customers.create_index("email", unique=True)
    database.products.create_index("name")
    database.plans.create_index("name")
    database.subscriptions.create_index("subscription_number", unique=True)
    database.invoices.create_index("invoice_number", unique=True)
    database.payments.create_index("reference")
