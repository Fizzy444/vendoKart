from datetime import datetime, timezone
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class GenericResponse(BaseModel):
    success: bool = True
    message: str
    data: Optional[Any] = None


class HealthResponse(BaseModel):
    status: str
    app_name: str
    environment: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    database: Dict[str, Any]
    redis: Dict[str, Any]
    storage: Dict[str, Any]
