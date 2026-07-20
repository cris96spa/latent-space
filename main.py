import uvicorn


def main() -> None:
    """Run the FastAPI application with Uvicorn for local development.

    A convenience entry point equivalent to `make serve`; the app is built via
    the `create_app` factory so no application object is constructed at import.
    """
    uvicorn.run("latent_space.app:create_app", factory=True, reload=True)


if __name__ == "__main__":
    main()
