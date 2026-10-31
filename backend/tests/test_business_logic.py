import pytest
from fastapi import HTTPException

from app.core.security import validate_password_strength
from app.services.billing import calculate_invoice_totals, validate_roles


def test_password_strength_rejects_weak_value():
    with pytest.raises(HTTPException):
        validate_password_strength("weak")


def test_password_strength_accepts_strong_value():
    validate_password_strength("Strong!Pass123")


def test_invoice_totals_are_calculated_consistently():
    totals = calculate_invoice_totals(1000, tax_rate=18, discount_rate=10, quantity=2)
    assert totals["subtotal"] == 2000
    assert totals["discount_amount"] == 200
    assert totals["tax_amount"] == 324
    assert totals["total"] == 2124


def test_roles_are_enforced():
    assert validate_roles("admin") is True
    assert validate_roles("staff") is True
    assert validate_roles("customer") is True
    assert validate_roles("external") is False
