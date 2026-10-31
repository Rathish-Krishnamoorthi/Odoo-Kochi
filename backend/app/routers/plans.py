from fastapi import APIRouter, HTTPException, status

from app.schemas.plan import PlanCreate, PlanOut

router = APIRouter(prefix="/plans", tags=["plans"])

plans_db: list[dict] = []


@router.get("/", response_model=list[PlanOut])
def list_plans():
    return [PlanOut(**plan) for plan in plans_db]


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=PlanOut)
def create_plan(payload: PlanCreate):
    plan = {"id": f"plan_{len(plans_db) + 1}", **payload.model_dump()}
    plans_db.append(plan)
    return PlanOut(**plan)


@router.get("/{plan_id}", response_model=PlanOut)
def get_plan(plan_id: str):
    plan = next((item for item in plans_db if item["id"] == plan_id), None)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found.")
    return PlanOut(**plan)
