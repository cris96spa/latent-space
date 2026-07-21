from fastapi import FastAPI

from latent_space.app import create_app

# Vercel Services routes /api/* to this service without stripping the prefix (unlike the
# Vite dev proxy and the nginx edge, which strip it). Mounting the unprefixed application
# under /api re-strips it, so the existing routers keep serving /health, /projects, and
# /chat/entries unchanged, single-origin.
app = FastAPI()
app.mount("/api", create_app())
