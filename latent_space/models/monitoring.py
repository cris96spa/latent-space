from typing import Literal

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Liveness signal consumed by the deploy pipeline's post-deploy smoke check."""

    status: Literal["ok"] = "ok"


class VersionResponse(BaseModel):
    version: str = Field(description="Installed distribution version of the application.")


class InfoResponse(BaseModel):
    """Human-facing summary returned at the API root."""

    name: str = Field(description="Name of the application.")
    version: str = Field(description="Installed distribution version of the application.")
