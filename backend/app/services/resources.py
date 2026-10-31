from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import EmailStr, TypeAdapter, ValidationError
from pymongo.errors import DuplicateKeyError

from app.core.dependencies import current_user, get_db, public_document, require_roles

STAFF = ("admin", "staff")
ADMIN = ("admin",)
CONFIG = {
    "customers": ({"name", "email"}, {"status": {"active", "inactive", "archived"}}),
    "products": ({"name", "sales_price", "cost_price"}, {"status": {"active", "inactive"}}),
    "plans": ({"name", "price"}, {"status": {"active", "inactive"}}),
    "subscriptions": ({"customer_id", "plan_id", "start_date"}, {"status": {"draft", "active", "paused", "cancelled", "expired"}}),
    "invoices": ({"customer_id", "due_date"}, {"status": {"draft", "sent", "partial", "paid", "overdue", "void"}}),
    "quotations": ({"customer_id", "expiry_date"}, {"status": {"draft", "sent", "accepted", "rejected", "expired", "converted"}}),
    "discounts": ({"name", "discount_rate"}, {"status": {"active", "inactive"}}),
    "tax_rules": ({"name", "rate"}, {"status": {"active", "inactive"}}),
    "payments": ({"invoice_id", "amount", "method"}, {"status": {"pending", "completed", "failed", "refunded"}}),
    "notifications": ({"user_id", "title", "message"}, {"status": {"unread", "read"}}),
}
ALLOWED_FIELDS = {
    "customers": {"name", "email", "phone", "billing_address", "shipping_address", "status", "notes"},
    "products": {"name", "description", "product_type", "sales_price", "cost_price", "status", "sku"},
    "plans": {"name", "description", "billing_frequency", "min_quantity", "status", "price", "features"},
    "subscriptions": {"customer_id", "plan_id", "start_date", "expiry_date", "status", "lines", "notes"},
    "invoices": {"customer_id", "subscription_id", "invoice_number", "due_date", "status", "lines", "notes"},
    "quotations": {"customer_id", "quotation_number", "expiry_date", "status", "lines", "notes"},
    "discounts": {"name", "description", "discount_rate", "status", "start_date", "expiry_date"},
    "tax_rules": {"name", "description", "rate", "status", "country", "region"},
    "payments": {"invoice_id", "amount", "method", "status", "reference", "paid_at", "notes"},
    "notifications": {"user_id", "title", "message", "status", "type"},
}
MONEY_FIELDS = {"price", "sales_price", "cost_price", "amount", "total_amount", "paid_amount", "unit_price"}
NUMBER_FIELDS = MONEY_FIELDS | {"quantity", "discount_rate", "tax_rate", "rate", "min_quantity"}
DEFAULTS = {
    "customers": {"status": "active"},
    "products": {"product_type": "software", "status": "active"},
    "plans": {"billing_frequency": "monthly", "min_quantity": 1, "status": "active"},
    "subscriptions": {"status": "draft", "lines": []},
    "invoices": {"status": "draft", "lines": []},
    "quotations": {"status": "draft", "lines": []},
    "discounts": {"status": "active"},
    "tax_rules": {"status": "active"},
    "notifications": {"status": "unread"},
}


def validate_payload(collection: str, data: dict, partial=False):
    required, enums = CONFIG[collection]
    if not isinstance(data, dict):
        raise HTTPException(422, "Expected a JSON object.")
    unknown = data.keys() - ALLOWED_FIELDS[collection]
    if unknown:
        raise HTTPException(422, f"Unsupported fields: {', '.join(sorted(unknown))}.")
    if not partial:
        missing = required - data.keys()
        if missing:
            raise HTTPException(422, f"Missing required fields: {', '.join(sorted(missing))}.")
    for key, value in data.items():
        if key in {"name", "email", "customer_id", "plan_id", "invoice_id", "method", "title", "message",
                   "invoice_number", "quotation_number", "start_date", "expiry_date", "due_date"}:
            if not isinstance(value, str) or not value.strip():
                raise HTTPException(422, f"{key} must be a non-empty string.")
        if key in {"description", "billing_address", "shipping_address", "phone", "notes", "sku",
                   "product_type", "billing_frequency", "country", "region", "type"}:
            if value is not None and (not isinstance(value, str) or len(value) > 4000):
                raise HTTPException(422, f"{key} must be a string of at most 4000 characters.")
        if key == "email":
            try:
                data[key] = str(TypeAdapter(EmailStr).validate_python(value)).lower()
            except ValidationError as exc:
                raise HTTPException(422, "email must be a valid email address.") from exc
        if key in NUMBER_FIELDS:
            if isinstance(value, bool) or not isinstance(value, int):
                raise HTTPException(422, f"{key} must be an integer amount/count (minor currency units).")
            if value < 0:
                raise HTTPException(422, f"{key} cannot be negative.")
        if key in enums and value not in enums[key]:
            raise HTTPException(422, f"Invalid {key}.")
    for field in ("discount_rate", "tax_rate", "rate"):
        if field in data and data[field] > 100:
            raise HTTPException(422, f"{field} must be between 0 and 100.")
    for field in ("start_date", "expiry_date", "due_date"):
        if field in data:
            try:
                datetime.fromisoformat(str(data[field]).replace("Z", "+00:00"))
            except ValueError as exc:
                raise HTTPException(422, f"{field} must be an ISO 8601 date or datetime.") from exc
    for field in ("lines", "items"):
        if field in data:
            if not isinstance(data[field], list):
                raise HTTPException(422, f"{field} must be a list.")
            if len(data[field]) > 500:
                raise HTTPException(422, f"{field} cannot contain more than 500 entries.")
            for line in data[field]:
                if not isinstance(line, dict):
                    raise HTTPException(422, f"Each {field} entry must be an object.")
                if set(line) - {"product_id", "description", "quantity", "unit_price", "tax_rate", "discount_rate"}:
                    raise HTTPException(422, "Line contains unsupported fields.")
                if "description" in line and (not isinstance(line["description"], str) or not line["description"].strip()):
                    raise HTTPException(422, "Line description must be a non-empty string.")
                if "product_id" in line and (not isinstance(line["product_id"], str) or not line["product_id"].strip()):
                    raise HTTPException(422, "Line product_id must be a non-empty string.")
                for key in ("quantity", "unit_price", "tax_rate", "discount_rate"):
                    if key in line and (isinstance(line[key], bool) or not isinstance(line[key], int) or line[key] < 0):
                        raise HTTPException(422, f"Line {key} must be a non-negative integer.")
                if line.get("quantity", 1) < 1:
                    raise HTTPException(422, "Line quantity must be at least one.")
                if line.get("tax_rate", 0) > 100 or line.get("discount_rate", 0) > 100:
                    raise HTTPException(422, "Line rates must be between 0 and 100.")
    return data


def audit(database, actor, action, collection, document_id):
    database.audit_logs.insert_one({
        "id": uuid4().hex, "actor_id": str(actor.get("id", "")),
        "actor_email": actor.get("email"), "action": action,
        "resource": collection, "resource_id": str(document_id),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })


def create_resource_router(collection: str, path: str | None = None, admin_write=False):
    router = APIRouter(prefix=f"/{path or collection.replace('_', '-')}", tags=[path or collection])
    write_roles = ADMIN if admin_write else STAFF

    def read_scope(database, user):
        role = user.get("role")
        if role in STAFF:
            return {}
        if role != "customer":
            raise HTTPException(403, "Insufficient permissions.")

        # Customer records are linked to login identities by normalized email.
        profile = database.customers.find_one({"email": str(user.get("email", "")).lower()})
        if collection in {"plans", "products"}:
            return {}
        if not profile:
            return {"id": "__no_customer_profile__"}
        customer_id = profile.get("id") or str(profile.get("_id", ""))
        if collection == "customers":
            return {"id": customer_id}
        if collection in {"invoices", "subscriptions", "quotations"}:
            return {"customer_id": customer_id}
        if collection == "payments":
            invoice_ids = [item["id"] for item in database.invoices.find(
                {"customer_id": customer_id}, {"id": 1}
            )]
            return {"invoice_id": {"$in": invoice_ids}} if invoice_ids else {"invoice_id": "__none__"}
        if collection == "notifications":
            values = [str(user.get("id", "")), str(user.get("email", "")).lower()]
            return {"user_id": {"$in": values}}
        raise HTTPException(403, "Insufficient permissions.")

    @router.get("")
    @router.get("/")
    def list_items(
        page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
        status_filter: str | None = Query(None, alias="status"),
        database=Depends(get_db), user=Depends(current_user),
    ):
        query = read_scope(database, user)
        if status_filter:
            query["status"] = status_filter
        total = database[collection].count_documents(query)
        cursor = database[collection].find(query).skip((page - 1) * page_size).limit(page_size)
        return {"items": [public_document(item) for item in cursor],
                "meta": {"page": page, "page_size": page_size, "total": total}}

    @router.post("", status_code=status.HTTP_201_CREATED)
    @router.post("/", status_code=status.HTTP_201_CREATED)
    def create_item(payload: dict, database=Depends(get_db), user=Depends(require_roles(*write_roles))):
        data = validate_payload(collection, payload)
        for key, value in DEFAULTS.get(collection, {}).items():
            data.setdefault(key, value)
        if collection == "payments":
            data.setdefault("status", "completed")
            if data["status"] not in {"pending", "completed", "failed"}:
                raise HTTPException(422, "A new payment must be pending, completed, or failed.")
        if collection in {"invoices", "quotations", "subscriptions"}:
            customer = database.customers.find_one({"id": data["customer_id"]})
            if not customer:
                raise HTTPException(422, "customer_id must reference an existing customer.")
        if collection == "subscriptions" and not database.plans.find_one({"id": data["plan_id"]}):
            raise HTTPException(422, "plan_id must reference an existing plan.")
        if collection == "subscriptions":
            for line in data.get("lines", []):
                if line.get("product_id") and not database.products.find_one({"id": line["product_id"]}):
                    raise HTTPException(422, "Subscription line product_id must reference an existing product.")
        if collection == "payments":
            invoice = database.invoices.find_one({"id": data["invoice_id"]})
            if not invoice:
                raise HTTPException(422, "invoice_id must reference an existing invoice.")
            if data["amount"] > max(0, invoice.get("total_amount", 0) - invoice.get("paid_amount", 0)):
                raise HTTPException(422, "Payment exceeds the invoice balance.")
        data.update({"id": uuid4().hex, "created_at": datetime.now(timezone.utc).isoformat(),
                     "updated_at": datetime.now(timezone.utc).isoformat()})
        if collection in {"subscriptions", "invoices", "quotations"}:
            number_key = {"subscriptions": "subscription_number", "invoices": "invoice_number",
                          "quotations": "quotation_number"}[collection]
            data.setdefault(number_key, f"{collection[:3].upper()}-{uuid4().hex[:8].upper()}")
        if collection in {"invoices", "quotations"}:
            data.update(calculate_line_totals(data.get("lines", [])))
            data.setdefault("paid_amount", 0)
        try:
            database[collection].insert_one(data)
        except DuplicateKeyError as exc:
            raise HTTPException(409, "A record with that unique value already exists.") from exc
        if collection == "payments" and data.get("status", "completed") == "completed":
            previous_paid = invoice.get("paid_amount", 0)
            paid = previous_paid + data["amount"]
            result = database.invoices.update_one({
                "id": data["invoice_id"], "paid_amount": previous_paid,
                "total_amount": invoice.get("total_amount", 0),
            }, {"$set": {
                "paid_amount": paid,
                "status": "paid" if paid >= invoice.get("total_amount", 0) else "partial",
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }})
            if not result.matched_count:
                database.payments.delete_one({"id": data["id"]})
                raise HTTPException(409, "Invoice changed while recording payment; retry the request.")
        audit(database, user, "create", collection, data["id"])
        return public_document(data)

    @router.get("/{item_id}")
    def get_item(item_id: str, database=Depends(get_db), user=Depends(current_user)):
        query = read_scope(database, user)
        if collection == "customers" and user.get("role") not in STAFF and query.get("id") != item_id:
            raise HTTPException(404, "Customer not found.")
        query["id"] = item_id
        item = database[collection].find_one(query)
        if not item:
            raise HTTPException(404, f"{collection.rstrip('s').replace('_', ' ').title()} not found.")
        return public_document(item)

    @router.put("/{item_id}")
    def update_item(item_id: str, payload: dict, database=Depends(get_db), user=Depends(require_roles(*write_roles))):
        if collection == "payments":
            raise HTTPException(409, "Payment ledger entries are immutable; use the refund action.")
        data = validate_payload(collection, payload, partial=True)
        if not data:
            raise HTTPException(422, "At least one field is required.")
        if "customer_id" in data and collection in {"invoices", "quotations", "subscriptions"}:
            if not database.customers.find_one({"id": data["customer_id"]}):
                raise HTTPException(422, "customer_id must reference an existing customer.")
        if collection == "subscriptions" and "plan_id" in data:
            if not database.plans.find_one({"id": data["plan_id"]}):
                raise HTTPException(422, "plan_id must reference an existing plan.")
        if collection == "subscriptions":
            for line in data.get("lines", []):
                if line.get("product_id") and not database.products.find_one({"id": line["product_id"]}):
                    raise HTTPException(422, "Subscription line product_id must reference an existing product.")
        data["updated_at"] = datetime.now(timezone.utc).isoformat()
        if collection in {"invoices", "quotations"} and "lines" in data:
            data.update(calculate_line_totals(data["lines"]))
        try:
            result = database[collection].find_one_and_update({"id": item_id}, {"$set": data}, return_document=True)
        except DuplicateKeyError as exc:
            raise HTTPException(409, "A record with that unique value already exists.") from exc
        if not result:
            raise HTTPException(404, f"{collection.rstrip('s').replace('_', ' ').title()} not found.")
        audit(database, user, "update", collection, item_id)
        return public_document(result)

    @router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
    def delete_item(item_id: str, database=Depends(get_db), user=Depends(require_roles(*write_roles))):
        if collection == "payments":
            raise HTTPException(409, "Payment ledger entries cannot be deleted.")
        result = database[collection].delete_one({"id": item_id})
        if not result.deleted_count:
            raise HTTPException(404, f"{collection.rstrip('s').replace('_', ' ').title()} not found.")
        audit(database, user, "delete", collection, item_id)
        return None

    return router


def calculate_lines(lines):
    return calculate_line_totals(lines)["total_amount"]


def calculate_line_totals(lines):
    subtotal = discount_amount = tax_amount = 0
    for line in lines:
        qty = line.get("quantity", 1)
        line_subtotal = qty * line.get("unit_price", 0)
        line_discount = line_subtotal * line.get("discount_rate", 0) // 100
        taxable = line_subtotal - line_discount
        subtotal += line_subtotal
        discount_amount += line_discount
        tax_amount += taxable * line.get("tax_rate", 0) // 100
    return {
        "subtotal_amount": subtotal,
        "discount_amount": discount_amount,
        "tax_amount": tax_amount,
        "total_amount": subtotal - discount_amount + tax_amount,
    }
