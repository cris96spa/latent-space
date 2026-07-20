from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import SettingsConfigDict

from latent_space.constants import ALLOWED_ORIGINS
from utils.configs import YamlBaseSettings


class AppSettings(YamlBaseSettings):
    """Process-level settings for the FastAPI application.

    Environment variables (prefixed `LATENT_SPACE_`) override the YAML file, per
    `YamlBaseSettings`. Defaults target a local development setup so a fresh
    checkout serves without extra configuration: the frontend runs on the Vite
    dev server and reaches the API cross-origin, which is the only case that
    needs CORS. In the production single-origin deploy the frontend proxies
    `/api` to the backend, so this list is empty there.
    """

    allowed_origins: list[str] = Field(
        description="Origins permitted by CORS, typically the frontend dev URL(s).",
        default_factory=lambda: list(ALLOWED_ORIGINS),
    )

    content_root: Path = Field(
        description="Root directory holding authored site content (projects, chat).",
        default=Path("content"),
    )

    model_config = SettingsConfigDict(
        yaml_file="configs/app.yaml",
        env_prefix="LATENT_SPACE_",
        case_sensitive=False,
        extra="ignore",
        yaml_file_encoding="utf-8",
    )


@lru_cache
def get_app_settings() -> AppSettings:
    """Return the process-wide application settings, loaded once and cached.

    Tests that need different settings should call `get_app_settings.cache_clear()`
    or override the FastAPI dependency rather than mutating the returned instance.
    """
    return AppSettings()
