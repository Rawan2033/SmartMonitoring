from fastapi import APIRouter

from ..runtime_settings import get_runtime_settings, update_runtime_settings
from ..schemas import RuntimeSettingsOut, RuntimeSettingsUpdateIn

router = APIRouter(prefix="/settings", tags=["settings"])


def _to_out() -> RuntimeSettingsOut:
    s = get_runtime_settings()
    return RuntimeSettingsOut(
        cleaningDustThreshold=s.cleaning_dust_threshold,
        voltageOnThreshold=s.voltage_on_threshold,
        insightCooldownSeconds=s.insight_cooldown_seconds,
        insightDailyCap=s.insight_daily_cap,
        dashboardRefreshSeconds=s.dashboard_refresh_seconds,
    )


@router.get("", response_model=RuntimeSettingsOut)
def get_settings():
    return _to_out()


@router.put("", response_model=RuntimeSettingsOut)
def put_settings(payload: RuntimeSettingsUpdateIn):
    update_runtime_settings(
        {
            "cleaning_dust_threshold": payload.cleaningDustThreshold,
            "voltage_on_threshold": payload.voltageOnThreshold,
            "insight_cooldown_seconds": payload.insightCooldownSeconds,
            "insight_daily_cap": payload.insightDailyCap,
            "dashboard_refresh_seconds": payload.dashboardRefreshSeconds,
        }
    )
    return _to_out()
