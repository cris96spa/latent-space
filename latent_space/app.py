from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from latent_space.api import chat, content, monitoring, tokenize
from latent_space.constants import APPLICATION_NAME
from latent_space.core.settings import AppSettings, get_app_settings


def create_app(settings: AppSettings | None = None) -> FastAPI:
    """Build and configure the FastAPI application.

    Constructing the app inside a factory (rather than at import time) keeps
    settings loading and router inclusion out of import side effects and lets
    tests build an app with injected settings. Run with Uvicorn's `--factory`
    flag so app creation happens on call, not on import.

    Args:
        settings: Application settings to use. Defaults to the process-wide
            cached settings when omitted.

    Returns:
        The configured FastAPI application, with CORS and routers included.
    """
    settings = settings or get_app_settings()

    app = FastAPI(title=APPLICATION_NAME)

    if settings.allowed_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.allowed_origins,
            allow_credentials=False,
            allow_methods=["GET", "POST"],
            allow_headers=["*"],
        )

    app.include_router(monitoring.router)
    app.include_router(content.router)
    app.include_router(chat.router)
    app.include_router(tokenize.router)

    return app
