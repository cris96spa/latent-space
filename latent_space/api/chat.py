from typing import Annotated

from fastapi import APIRouter, Depends

from latent_space.api.dependencies import get_content_service
from latent_space.models.content import ChatEntryResponse
from latent_space.services.content import ContentService

router = APIRouter(tags=["chat"])


@router.get("/chat/entries")
async def list_chat_entries(
    service: Annotated[ContentService, Depends(get_content_service)],
) -> list[ChatEntryResponse]:
    """List published scripted-chat entries in display order."""
    return service.chat_entries()
