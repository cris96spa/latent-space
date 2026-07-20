from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from latent_space.api.dependencies import get_content_service
from latent_space.models.content import ProjectDetail, ProjectSummary
from latent_space.services.content import ContentService

router = APIRouter(tags=["content"])


@router.get("/projects")
async def list_projects(
    service: Annotated[ContentService, Depends(get_content_service)],
) -> list[ProjectSummary]:
    """List published projects, most recently published first."""
    return service.published_project_summaries()


@router.get("/projects/{slug}")
async def get_project(
    slug: str,
    service: Annotated[ContentService, Depends(get_content_service)],
) -> ProjectDetail:
    """Return one published project by slug.

    Args:
        slug: Persistent identifier of the requested project.
        service: Content service that owns published projects.

    Returns:
        The project's detail, including its rendered body.

    Raises:
        HTTPException: 404 when no published project has the slug; a draft slug
            is treated as absent.
    """
    project = service.published_project_detail(slug)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No published project with slug '{slug}'.",
        )
    return project
