from functools import lru_cache
from pathlib import Path
from typing import Annotated

from fastapi import Depends

from latent_space.core.settings import AppSettings, get_app_settings
from latent_space.services.content import ContentService


@lru_cache
def _content_service_for_root(content_root: Path) -> ContentService:
    return ContentService.from_content_root(content_root)


def get_content_service(
    settings: Annotated[AppSettings, Depends(get_app_settings)],
) -> ContentService:
    """Provide the process-wide content service.

    Content is read, validated, and rendered once per content root and cached,
    so requests do not re-hit the filesystem. Tests override this dependency to
    inject a service built from fixture content.
    """
    return _content_service_for_root(settings.content_root)
