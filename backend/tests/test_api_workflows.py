import asyncio
from copy import deepcopy

import httpx
import pytest

from app.core.dependencies import get_db
from app.core.security import hash_password
from app.main import app


class Cursor(list):
    def skip(self, count):
        return Cursor(self[count:])

    def limit(self, count):
        return Cursor(self[:count])

    def sort(self, key, direction):
        return Cursor(sorted(self, key=lambda row: row.get(key, ""), reverse=direction < 0))


class Collection:
    def __init__(self):
        self.rows = []

    @staticmethod
    def matches(row, query):
        for key, wanted in query.items():
            value = row.get(key)
            if isinstance(wanted, dict):
                if "$in" in wanted and value not in wanted["$in"]:
                    return False
                if "$gte" in wanted and (value is None or value < wanted["$gte"]):
                    return False
                if "$lte" in wanted and (value is None or value > wanted["$lte"]):
                    return False
            elif value != wanted:
                return False
        return True

    def find_one(self, query, projection=None):
        row = next((r for r in self.rows if self.matches(r, query)), None)
        if row is None:
            return None
        result = deepcopy(row)
        if projection:
            included = {key for key, value in projection.items() if value}
            if included:
                result = {key: value for key, value in result.items() if key in included or key == "_id"}
            else:
                for key, excluded in projection.items():
                    if excluded:
                        result.pop(key, None)
        return result

    def insert_one(self, row):
        self.rows.append(deepcopy(row))

    def find(self, query=None, projection=None):
        query = query or {}
        rows = [deepcopy(r) for r in self.rows if self.matches(r, query)]
        if projection:
            included = {key for key, value in projection.items() if value}
            if included:
                rows = [{key: value for key, value in row.items() if key in included or key == "_id"} for row in rows]
            else:
                for row in rows:
                    for key, excluded in projection.items():
                        if excluded:
                            row.pop(key, None)
        return Cursor(rows)

    def count_documents(self, query):
        return sum(self.matches(row, query) for row in self.rows)

    def find_one_and_update(self, query, update, return_document=True):
        for row in self.rows:
            if self.matches(row, query):
                row.update(deepcopy(update.get("$set", {})))
                for key, amount in update.get("$inc", {}).items():
                    row[key] = row.get(key, 0) + amount
                return deepcopy(row)
        return None

    def update_one(self, query, update):
        for row in self.rows:
            if self.matches(row, query):
                row.update(deepcopy(update.get("$set", {})))
                for key, amount in update.get("$inc", {}).items():
                    row[key] = row.get(key, 0) + amount
                return type("Result", (), {"matched_count": 1, "deleted_count": 0})()
        return type("Result", (), {"matched_count": 0, "deleted_count": 0})()

    def delete_one(self, query):
        for index, row in enumerate(self.rows):
            if self.matches(row, query):
                self.rows.pop(index)
                return type("Result", (), {"deleted_count": 1})()
        return type("Result", (), {"deleted_count": 0})()


class Database:
    def __init__(self):
        self.collections = {}

    def __getattr__(self, name):
        return self[name]

    def __getitem__(self, name):
        if name not in self.collections:
            self.collections[name] = Collection()
        return self.collections[name]


@pytest.fixture
def api_client():
    database = Database()
    database.users.insert_one({
        "id": "admin-1", "name": "Admin", "email": "admin@example.com",
        "role": "admin", "status": "active", "password_hash": hash_password("Strong!Pass123"),
    })
    database.users.insert_one({
        "id": "buyer-user", "name": "Buyer", "email": "buyer@example.com",
        "role": "customer", "status": "active", "password_hash": hash_password("Strong!Pass123"),
    })
    database.users.insert_one({
        "id": "orphan-user", "name": "Orphan", "email": "orphan@example.com",
        "role": "customer", "status": "active", "password_hash": hash_password("Strong!Pass123"),
    })
    database.customers.insert_one({"id": "buyer-customer", "name": "Buyer Profile", "email": "buyer@example.com"})
    database.customers.insert_one({"id": "other-customer", "name": "Other Profile", "email": "other@example.com"})
    database.invoices.insert_one({
        "id": "buyer-overdue", "customer_id": "buyer-customer", "invoice_number": "INV-BUYER",
        "due_date": "2026-01-01", "status": "overdue", "total_amount": 2000, "paid_amount": 0,
    })
    database.invoices.insert_one({
        "id": "other-overdue", "customer_id": "other-customer", "invoice_number": "INV-OTHER",
        "due_date": "2026-01-02", "status": "overdue", "total_amount": 3000, "paid_amount": 0,
    })
    database.invoices.insert_one({
        "id": "other-current", "customer_id": "other-customer", "invoice_number": "INV-CURRENT",
        "due_date": "2026-12-01", "status": "sent", "total_amount": 4000, "paid_amount": 0,
    })
    database.subscriptions.insert_one({
        "id": "buyer-subscription", "customer_id": "buyer-customer",
        "subscription_number": "SUB-BUYER", "status": "active",
    })
    database.subscriptions.insert_one({
        "id": "other-subscription", "customer_id": "other-customer",
        "subscription_number": "SUB-OTHER", "status": "active",
    })
    app.dependency_overrides[get_db] = lambda: database
    # ASGITransport deliberately skips application lifespan; tests supply an isolated DB.
    async def request(method, url, **kwargs):
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app),
                                     base_url="http://test") as client:
            return await client.request(method, url, **kwargs)

    yield lambda *args, **kwargs: asyncio.run(request(*args, **kwargs))
    app.dependency_overrides.clear()


def test_persisted_business_api_workflow_and_roles(api_client):
    response = api_client("POST", "/api/v1/auth/login",
                          json={"email": "admin@example.com", "password": "Strong!Pass123"})
    assert response.status_code == 200
    headers = {"Authorization": f"Bearer {response.json()['access_token']}"}

    customer = api_client("POST", "/api/v1/customers", headers=headers,
                          json={"name": "Example Customer", "email": "buyer@example.com"})
    assert customer.status_code == 201
    customer_id = customer.json()["id"]
    plan = api_client("POST", "/api/v1/plans", headers=headers,
                      json={"name": "Monthly", "price": 3000})
    assert plan.status_code == 201

    invoice = api_client("POST", "/api/v1/invoices", headers=headers, json={
        "customer_id": customer_id, "invoice_number": "INV-001",
        "due_date": "2026-11-30", "lines": [
            {"description": "Service", "quantity": 2, "unit_price": 2000,
             "discount_rate": 10, "tax_rate": 18}
        ],
    })
    assert invoice.status_code == 201
    assert invoice.json()["total_amount"] == 4248

    payment = api_client("POST", "/api/v1/payments", headers=headers,
                         json={"invoice_id": invoice.json()["id"], "amount": 1000, "method": "manual"})
    assert payment.status_code == 201
    assert payment.json()["status"] == "completed"
    report = api_client("GET", "/api/v1/reports/dashboard", headers=headers)
    assert report.json()["total_revenue"] == 1000
    assert report.json()["outstanding_amount"] == 12248
    assert api_client("GET", "/api/v1/audit-logs", headers=headers).json()["meta"]["total"] >= 4

    refunded = api_client("POST", f"/api/v1/payments/{payment.json()['id']}/refund", headers=headers)
    assert refunded.status_code == 200
    assert refunded.json()["status"] == "refunded"
    assert api_client("GET", "/api/v1/reports/dashboard", headers=headers).json()["total_revenue"] == 0

    quotation = api_client("POST", "/api/v1/quotations", headers=headers, json={
        "customer_id": customer_id, "quotation_number": "QUO-001",
        "expiry_date": "2026-12-01", "status": "accepted",
        "lines": [{"description": "Service", "quantity": 1, "unit_price": 500}],
    })
    assert quotation.status_code == 201
    converted = api_client("POST", f"/api/v1/quotations/{quotation.json()['id']}/convert", headers=headers)
    assert converted.status_code == 201
    again = api_client("POST", f"/api/v1/quotations/{quotation.json()['id']}/convert", headers=headers)
    assert again.status_code == 201
    assert again.json()["id"] == converted.json()["id"]

    invalid = api_client("POST", "/api/v1/products", headers=headers,
                         json={"name": "Invalid", "sales_price": 1.5, "cost_price": 0})
    assert invalid.status_code == 422


def test_registration_cannot_escalate_role_and_customer_is_forbidden(api_client):
    escalation = api_client("POST", "/api/v1/auth/register", json={
        "name": "New User", "email": "new@example.com",
        "password": "Strong!Pass123", "role": "admin",
    })
    assert escalation.status_code == 422
    registered = api_client("POST", "/api/v1/auth/register", json={
        "name": "New User", "email": "new@example.com", "password": "Strong!Pass123",
    })
    assert registered.status_code == 201
    login = api_client("POST", "/api/v1/auth/login",
                       json={"email": "new@example.com", "password": "Strong!Pass123"})
    token = login.json()["access_token"]
    result = api_client("POST", "/api/v1/plans", headers={"Authorization": f"Bearer {token}"},
                        json={"name": "No write", "price": 100})
    assert result.status_code == 403


def test_logout_is_safe_stateless_noop(api_client):
    response = api_client("POST", "/api/v1/auth/logout")
    assert response.status_code == 204
    assert response.content == b""


def test_resource_reads_require_authentication(api_client):
    for path in ("/api/v1/customers", "/api/v1/invoices", "/api/v1/subscriptions"):
        assert api_client("GET", path).status_code == 401
        assert api_client("GET", f"{path}/some-id").status_code == 401


def test_customer_reads_are_scoped_to_linked_profile(api_client):
    login = api_client("POST", "/api/v1/auth/login",
                       json={"email": "buyer@example.com", "password": "Strong!Pass123"})
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    customers = api_client("GET", "/api/v1/customers", headers=headers).json()
    assert customers["meta"]["total"] == 1
    assert customers["items"][0]["id"] == "buyer-customer"
    assert api_client("GET", "/api/v1/customers/buyer-customer", headers=headers).status_code == 200
    assert api_client("GET", "/api/v1/customers/other-customer", headers=headers).status_code == 404

    invoices = api_client("GET", "/api/v1/invoices", headers=headers).json()
    assert [item["id"] for item in invoices["items"]] == ["buyer-overdue"]
    assert api_client("GET", "/api/v1/invoices/buyer-overdue", headers=headers).status_code == 200
    assert api_client("GET", "/api/v1/invoices/other-overdue", headers=headers).status_code == 404
    subscriptions = api_client("GET", "/api/v1/subscriptions", headers=headers).json()
    assert [item["id"] for item in subscriptions["items"]] == ["buyer-subscription"]
    assert api_client("GET", "/api/v1/subscriptions/other-subscription", headers=headers).status_code == 404

    admin_login = api_client("POST", "/api/v1/auth/login",
                             json={"email": "admin@example.com", "password": "Strong!Pass123"})
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}
    assert api_client("GET", "/api/v1/invoices", headers=admin_headers).json()["meta"]["total"] == 3


def test_customer_without_profile_gets_empty_list_and_not_found(api_client):
    login = api_client("POST", "/api/v1/auth/login",
                       json={"email": "orphan@example.com", "password": "Strong!Pass123"})
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    result = api_client("GET", "/api/v1/invoices", headers=headers)
    assert result.status_code == 200
    assert result.json()["items"] == []
    assert result.json()["meta"]["total"] == 0
    assert api_client("GET", "/api/v1/customers/missing", headers=headers).status_code == 404


def test_overdue_report_returns_only_overdue_and_revenue_is_not_mrr(api_client):
    login = api_client("POST", "/api/v1/auth/login",
                       json={"email": "admin@example.com", "password": "Strong!Pass123"})
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    overdue = api_client("GET", "/api/v1/reports/overdue", headers=headers)
    assert overdue.status_code == 200
    assert overdue.json()["count"] == 2
    assert {invoice["id"] for invoice in overdue.json()["invoices"]} == {"buyer-overdue", "other-overdue"}
    dashboard = api_client("GET", "/api/v1/reports/dashboard", headers=headers).json()
    assert "mr" not in dashboard
    assert "mrr" not in dashboard
    assert "arr" not in dashboard
    assert api_client("GET", "/api/v1/reports/overdue").status_code == 401
