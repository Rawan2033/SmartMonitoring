from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, model_validator
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import SensorReading

router = APIRouter(prefix="/ingest", tags=["ingest"])


class IngestReadingIn(BaseModel):
    temperature_c: float = Field(..., ge=-40, le=125)
    humidity_percent: float = Field(..., ge=0, le=100)
    dust_percent: float | None = Field(default=None, ge=0, le=100)
    tcrt_raw: int | None = Field(default=None, ge=0, le=4095)
    timestamp: datetime | None = None

    @model_validator(mode="after")
    def require_dust_or_tcrt(self) -> "IngestReadingIn":
        if self.dust_percent is None and self.tcrt_raw is None:
            raise ValueError("Either dust_percent or tcrt_raw must be provided.")
        return self


def _dust_from_tcrt_raw(tcrt_raw: int) -> float:
    # Initial linear mapping (to be calibrated with field data later).
    dust = 100.0 - ((float(tcrt_raw) / 4095.0) * 100.0)
    return round(max(0.0, min(100.0, dust)), 2)


@router.post("/reading")
def ingest_reading(payload: IngestReadingIn, db: Session = Depends(get_db)):
    dust_value = payload.dust_percent
    if dust_value is None:
        if payload.tcrt_raw is None:
            raise HTTPException(status_code=400, detail="Missing dust_percent and tcrt_raw.")
        dust_value = _dust_from_tcrt_raw(payload.tcrt_raw)

    row = SensorReading(
        timestamp=payload.timestamp or datetime.now(),
        dust_percent=float(dust_value),
        temperature_c=float(payload.temperature_c),
        humidity_percent=float(payload.humidity_percent),
    )

    db.add(row)
    db.commit()

    return {
        "ok": True,
        "saved": {
            "timestamp": row.timestamp.isoformat(),
            "dust_percent": float(row.dust_percent),
            "temperature_c": float(row.temperature_c),
            "humidity_percent": float(row.humidity_percent),
        },
    }
