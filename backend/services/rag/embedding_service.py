import httpx
from typing import List
from langchain_core.embeddings import Embeddings
from config import get_settings
from utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()


class GeminiRestEmbeddings(Embeddings):
    """
    Custom LangChain-compatible embeddings class using Gemini's REST API.
    Does not require local PyTorch or sentence-transformers dependencies.
    """
    def get_embedding(self, text: str) -> list[float]:
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            logger.error("GEMINI_API_KEY is not configured for embeddings")
            return [0.0] * 768

        url = f"https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent?key={api_key}"
        payload = {
            "model": "models/text-embedding-004",
            "content": {
                "parts": [{"text": text}]
            }
        }

        try:
            with httpx.Client(timeout=20.0) as client:
                response = client.post(url, json=payload, headers={"Content-Type": "application/json"})
            if response.status_code == 200:
                data = response.json()
                embedding = data.get("embedding", {}).get("values", [])
                if embedding:
                    return embedding
            logger.error("Gemini Embeddings API error — status=%s body=%s", response.status_code, response.text)
        except Exception as exc:
            logger.error("Exception calling Gemini Embeddings API: %s", exc)

        return [0.0] * 768

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self.get_embedding(t) for t in texts]

    def embed_query(self, text: str) -> List[float]:
        return self.get_embedding(text)


_embedding_model = None


def get_embedding_model():
    """
    Returns the custom Gemini REST embedding model instance.
    Runs in the cloud (no local CPU/RAM footprint).
    """
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = GeminiRestEmbeddings()
    return _embedding_model
