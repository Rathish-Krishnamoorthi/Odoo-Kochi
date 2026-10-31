from fastapi import APIRouter, HTTPException, status

from app.schemas.subscription import SubscriptionCreate, SubscriptionOut

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

subscriptions_db: list[dict] = []


@router.get("/", response_model=list[SubscriptionOut])
def list_subscriptions():
    return [SubscriptionOut(**subscription) for subscription in subscriptions_db]


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=SubscriptionOut)
def create_subscription(payload: SubscriptionCreate):
    subscription = {
        "id": f"sub_{len(subscriptions_db) + 1}",
        "subscription_number": f"SUB-{len(subscriptions_db) + 1:05d}",
        **payload.model_dump(),
    }
    subscriptions_db.append(subscription)
    return SubscriptionOut(**subscription)


@router.get("/{subscription_id}", response_model=SubscriptionOut)
def get_subscription(subscription_id: str):
    subscription = next((item for item in subscriptions_db if item["id"] == subscription_id), None)
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found.")
    return SubscriptionOut(**subscription)
