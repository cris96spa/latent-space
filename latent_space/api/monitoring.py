from fastapi import APIRouter

from latent_space.constants import APPLICATION_NAME
from latent_space.core.version import get_app_version
from latent_space.models.monitoring import HealthResponse, InfoResponse, VersionResponse

router = APIRouter(tags=["monitoring"])


@router.get("/health")
async def health() -> HealthResponse:
    """Report that the process is up.

    Deliberately independent of content or chat readiness so the deploy pipeline
    always has a stable signal to check.
    """
    return HealthResponse()


@router.get("/version")
async def read_version() -> VersionResponse:
    return VersionResponse(version=get_app_version())


@router.get("/")
async def info() -> InfoResponse:
    return InfoResponse(name=APPLICATION_NAME, version=get_app_version())
