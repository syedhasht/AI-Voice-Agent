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

        if api_key.startswith('"') and api_key.endswith('"'):
            api_key = api_key[1:-1]

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={api_key}"
        payload = {
            "model": "models/gemini-embedding-001",
            "content": {
                "parts": [{"text": text}]
            },
            "outputDimensionality": 768
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
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            logger.error("GEMINI_API_KEY is not configured for embeddings")
            return [[0.0] * 768 for _ in texts]

        if api_key.startswith('"') and api_key.endswith('"'):
            api_key = api_key[1:-1]

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents?key={api_key}"
        embeddings_list = []
        batch_size = 50

        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i+batch_size]
            requests = []
            for text in batch_texts:
                requests.append({
                    "model": "models/gemini-embedding-001",
                    "content": {
                        "parts": [{"text": text}]
                    },
                    "outputDimensionality": 768
                })

            payload = {"requests": requests}
            try:
                with httpx.Client(timeout=30.0) as client:
                    response = client.post(url, json=payload, headers={"Content-Type": "application/json"})
                if response.status_code == 200:
                    data = response.json()
                    for emb in data.get("embeddings", []):
                        embeddings_list.append(emb.get("values", []))
                else:
                    logger.error("Gemini Batch Embeddings API error — status=%s body=%s", response.status_code, response.text)
                    for _ in batch_texts:
                        embeddings_list.append([0.0] * 768)
            except Exception as exc:
                logger.error("Exception calling Gemini Batch Embeddings API: %s", exc)
                for _ in batch_texts:
                    embeddings_list.append([0.0] * 768)

        return embeddings_list

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

