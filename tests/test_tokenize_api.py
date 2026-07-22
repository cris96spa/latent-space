from collections.abc import Iterator

import pytest
import tiktoken
from fastapi.testclient import TestClient

from latent_space.api.dependencies import get_tokenizer_service
from latent_space.app import create_app
from latent_space.core.settings import AppSettings
from latent_space.services.tokenizer import TokenizerService


def _fixture_service() -> TokenizerService:
    return TokenizerService(tiktoken.get_encoding("gpt2"))


@pytest.fixture
def client() -> Iterator[TestClient]:
    app = create_app(settings=AppSettings(allowed_origins=[]))
    app.dependency_overrides[get_tokenizer_service] = _fixture_service
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_tokenize_returns_real_gpt2_tokens_and_counts(client: TestClient):
    response = client.post("/tokenize", json={"text": "Who is Cristian?"})

    assert response.status_code == 200
    body = response.json()
    assert body["token_count"] == 5
    assert body["word_count"] == 3
    assert body["char_count"] == 16
    assert body["tokens"][0] == {"id": 8241, "text": "Who"}


def test_tokenize_accepts_empty_text(client: TestClient):
    response = client.post("/tokenize", json={"text": ""})

    assert response.status_code == 200
    assert response.json() == {"tokens": [], "token_count": 0, "word_count": 0, "char_count": 0}


def test_tokenize_rejects_oversize_input(client: TestClient):
    response = client.post("/tokenize", json={"text": "x" * 8001})

    assert response.status_code == 422
