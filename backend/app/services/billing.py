def calculate_invoice_totals(base_amount: int, tax_rate: float = 0, discount_rate: float = 0, quantity: int = 1) -> dict:
    quantity = max(1, quantity)
    subtotal = base_amount * quantity
    discount_amount = subtotal * (discount_rate / 100)
    taxable_amount = subtotal - discount_amount
    tax_amount = taxable_amount * (tax_rate / 100)
    total = taxable_amount + tax_amount
    return {
        "subtotal": int(subtotal),
        "discount_amount": int(discount_amount),
        "tax_amount": int(tax_amount),
        "total": int(total),
    }


def validate_roles(role: str) -> bool:
    return role in {"admin", "staff", "customer"}
