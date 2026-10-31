def build_dashboard_snapshot(customers: list, products: list, subscriptions: list, invoices: list) -> dict:
    active_subscriptions = sum(1 for item in subscriptions if item.get("status") == "active")
    overdue_invoices = sum(1 for item in invoices if item.get("status") == "overdue")
    total_revenue = sum(int(item.get("total_amount", 0)) for item in invoices)
    return {
        "active_subscriptions": active_subscriptions,
        "customers": len(customers),
        "products": len(products),
        "overdue_invoices": overdue_invoices,
        "total_revenue": total_revenue,
        "mr": total_revenue,
    }
