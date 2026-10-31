from fastapi import APIRouter, HTTPException, status

from app.schemas.product import ProductCreate, ProductOut

router = APIRouter(prefix="/products", tags=["products"])

products_db: list[dict] = []


@router.get("/", response_model=list[ProductOut])
def list_products():
    return [ProductOut(**product) for product in products_db]


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=ProductOut)
def create_product(payload: ProductCreate):
    product = {"id": f"product_{len(products_db) + 1}", **payload.model_dump()}
    products_db.append(product)
    return ProductOut(**product)


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: str):
    product = next((item for item in products_db if item["id"] == product_id), None)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    return ProductOut(**product)
