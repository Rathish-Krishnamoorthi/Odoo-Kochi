from pydantic import BaseModel, Field
from typing import Generic, TypeVar

T = TypeVar("T")


class ResponseMeta(BaseModel):
    page: int = 1
    page_size: int = 20
    total: int = 0


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    meta: ResponseMeta = Field(default_factory=ResponseMeta)
