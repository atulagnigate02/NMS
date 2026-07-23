from typing import Any, Generic, TypeVar

from fastapi import HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database.session import Base


ModelT = TypeVar("ModelT", bound=Base)
CreateT = TypeVar("CreateT", bound=BaseModel)
UpdateT = TypeVar("UpdateT", bound=BaseModel)


class CRUDRouterMixin(Generic[ModelT, CreateT, UpdateT]):
    def __init__(self, model: type[ModelT]):
        self.model = model

    def list(self, db: Session, skip: int = 0, limit: int = 100) -> list[ModelT]:
        return db.query(self.model).offset(skip).limit(min(limit, 500)).all()

    def get(self, db: Session, item_id: int) -> ModelT:
        item = db.get(self.model, item_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
        return item

    def create(self, db: Session, payload: CreateT | dict[str, Any]) -> ModelT:
        data = payload if isinstance(payload, dict) else payload.model_dump()
        item = self.model(**data)
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    def update(self, db: Session, item_id: int, payload: UpdateT | dict[str, Any]) -> ModelT:
        item = self.get(db, item_id)
        data = payload if isinstance(payload, dict) else payload.model_dump(exclude_unset=True)
        for key, value in data.items():
            setattr(item, key, value)
        db.commit()
        db.refresh(item)
        return item

    def delete(self, db: Session, item_id: int) -> dict[str, bool]:
        item = self.get(db, item_id)
        db.delete(item)
        db.commit()
        return {"deleted": True}
