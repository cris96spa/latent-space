from typing import Annotated

from fastapi import APIRouter, Depends

from latent_space.api.dependencies import get_tokenizer_service
from latent_space.models.tokenizer import TokenizeRequest, TokenizeResponse
from latent_space.services.tokenizer import TokenizerService

router = APIRouter(tags=["tokenizer"])


@router.post("/tokenize")
async def tokenize_text(
    request: TokenizeRequest,
    service: Annotated[TokenizerService, Depends(get_tokenizer_service)],
) -> TokenizeResponse:
    """Tokenize `text` with GPT-2 byte-level BPE, returning tokens, ids, and counts."""
    return service.tokenize(request.text)
