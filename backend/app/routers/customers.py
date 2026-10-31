from fastapi import APIRouter, HTTPException, status

from app.schemas.customer import CustomerCreate, CustomerOut

router = APIRouter(prefix="/customers", tags=["customers"])

customers_db: list[dict] = []


@router.get("/", response_model=list[CustomerOut])
def list_customers():
    return [CustomerOut(**customer) for customer in customers_db]


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=CustomerOut)
def create_customer(payload: CustomerCreate):
    customer = {"id": f"customer_{len(customers_db) + 1}", **payload.model_dump()}
    customers_db.append(customer)
    return CustomerOut(**customer)


@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(customer_id: str):
    customer = next((item for item in customers_db if item["id"] == customer_id), None)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")
    return CustomerOut(**customer)


@router.put("/{customer_id}", response_model=CustomerOut)
def update_customer(customer_id: str, payload: CustomerCreate):
    for index, customer in enumerate(customers_db):
        if customer["id"] == customer_id:
            updated = {**customer, **payload.model_dump()}
            customers_db[index] = updated
            return CustomerOut(**updated)
    raise HTTPException(status_code=404, detail="Customer not found.")
