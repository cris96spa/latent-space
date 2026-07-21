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


@router.get("/projects/{public_identifier}")
async def get_project(
    public_identifier: str,
    service: Annotated[ContentService, Depends(get_content_service)],
) -> ProjectDetail:
    """Return one published project by public identifier.

    Args:
        public_identifier: Persistent identifier of the requested project.
        service: Content service that owns published projects.

    Returns:
        The project's detail, including its rendered body.

    Raises:
        HTTPException: 404 when no published project has the public identifier; a draft
            public identifier is treated as absent.
    """
    project = service.published_project_detail(public_identifier)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No published project with public identifier '{public_identifier}'.",
        )
    return project
