from pathlib import Path
from langchain_community.vectorstores import Chroma

from utils.logger import get_logger
from .embedding_service import get_embedding_model

logger = get_logger(__name__)

# Persist directory at backend/chroma_db/
CHROMA_DB_DIR = Path(__file__).resolve().parents[2] / "chroma_db"
COLLECTION_NAME = "rag_documents"


def get_vector_store() -> Chroma:
    """
    Initializes and returns the persistent Chroma vector store connection.
    """
    embeddings = get_embedding_model()
    return Chroma(
        persist_directory=str(CHROMA_DB_DIR),
        embedding_function=embeddings,
        collection_name=COLLECTION_NAME
    )


def index_documents_if_needed(chunks, force: bool = False):
    """
    Indexes the document chunks into ChromaDB if the database is missing or empty.
    If force=True, recreates the collection.
    """
    store = get_vector_store()
    
    try:
        count = store._collection.count()
    except Exception as exc:
        logger.warning("Could not count collection items, assuming empty: %s", exc)
        count = 0

    if count == 0 or force:
        logger.info("Indexing %d chunks into ChromaDB...", len(chunks))
        if force and count > 0:
            # Recreate store by deleting collection
            store.delete_collection()
            store = get_vector_store()
            
        store.add_documents(chunks)
        logger.info("Persisted indexed chunks successfully to %s", CHROMA_DB_DIR)
    else:
        logger.info("ChromaDB already contains %d chunks. Skipping indexing.", count)
