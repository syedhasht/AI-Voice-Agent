import shutil
import threading
from pathlib import Path
from typing import List, Dict, Any

from utils.logger import get_logger
from .document_loader import load_and_split_documents
from .vector_store import get_vector_store, index_documents_if_needed

logger = get_logger(__name__)


def initialize_rag(force: bool = False):
    """
    Called on startup to set up the RAG documents directory,
    copy documents from workspace root if necessary, and index them in ChromaDB.
    """
    backend_dir = Path(__file__).resolve().parents[2]
    documents_dir = backend_dir / "documents"
    documents_dir.mkdir(exist_ok=True)

    # Automatically copy source PDFs from workspace root if they exist
    workspace_root = backend_dir.parent
    pdfs = [
        "Medicine Catalog.pdf",
        "SOP.pdf",
        "Exchange and Refund Policy.pdf"
    ]

    for pdf in pdfs:
        src = workspace_root / pdf
        dst = documents_dir / pdf
        if src.exists() and not dst.exists():
            try:
                shutil.copy2(src, dst)
                logger.info("Copied PDF source %s to documents directory", pdf)
            except Exception as exc:
                logger.error("Failed to copy PDF %s: %s", pdf, exc)

    # Run loader & indexer
    try:
        chunks = load_and_split_documents(documents_dir)
        if chunks:
            index_documents_if_needed(chunks, force=force)
        else:
            logger.warning("No document chunks loaded during startup initialization.")
    except Exception as exc:
        logger.error("Failed during RAG vector store indexing: %s", exc)


_rag_initialized = False
_rag_init_lock = threading.Lock()


def search_documents(question: str) -> List[Dict[str, Any]]:
    """
    Queries the vector database for relevant text chunks matching the question.
    Returns the top 5 matches with document source, page number, and similarity score.
    """
    global _rag_initialized
    if not _rag_initialized:
        with _rag_init_lock:
            # Double-checked locking
            if not _rag_initialized:
                logger.info("First RAG query received: Lazily initializing vector database...")
                try:
                    initialize_rag()
                    _rag_initialized = True
                    logger.info("RAG vector database lazy-initialization complete.")
                except Exception as exc:
                    logger.error("Failed during RAG lazy-initialization: %s", exc)
            
    store = get_vector_store()
    
    try:
        # standard relevance search returning normalized score [0, 1]
        results = store.similarity_search_with_relevance_scores(question, k=5)
    except Exception as exc:
        logger.warning("Standard relevance search failed, trying distance-based fallback: %s", exc)
        try:
            raw_results = store.similarity_search_with_score(question, k=5)
            # Convert raw L2 distance to mock similarity score [0, 1]
            results = []
            for doc, distance in raw_results:
                # distance is typically L2 distance. Cosine distance can also be returned.
                # Standardize as a score where higher is better.
                sim = max(0.0, min(1.0, 1.0 - (distance / 2.0)))
                results.append((doc, sim))
        except Exception as inner_exc:
            logger.error("Vector store query failed: %s", inner_exc)
            return []

    matches = []
    for doc, score in results:
        matches.append({
            "document": doc.metadata.get("source", "Unknown"),
            "page": doc.metadata.get("page", 0) + 1,  # human-readable 1-indexed page
            "score": round(float(score), 4),
            "text": doc.page_content
        })
        
    return matches


_RAG_PROMPT = """You are a helpful pharmacy policy assistant.
A user asked the following question about our pharmacy policies, catalogs, or SOPs:
"{question}"

Here are the retrieved relevant document segments:
{context}

Please generate a clear, professional, and concise answer (2-4 sentences) addressing the user's question directly using ONLY the information from the segments above.
If the retrieved context does not contain the answer, politely state that you cannot find the answer in the policy documentation.
Do NOT make up any facts or reference external information. Do NOT mention page numbers, vector databases, or SQL in your answer.

Answer:"""


def generate_rag_answer(question: str, matches: List[Dict[str, Any]]) -> str:
    """Uses the active LLM API to synthesize a natural language response based on matching segments."""
    if not matches:
        return "I could not find any relevant documentation to answer this question."

    # Build context string
    context_parts = []
    for i, m in enumerate(matches):
        context_parts.append(f"Segment {i+1} (Source: {m['document']}):\n{m['text']}")
    context_str = "\n\n".join(context_parts)

    prompt = _RAG_PROMPT.format(question=question, context=context_str)

    try:
        from services.ai_assistant.explanation_service import _call_gemini
        response = _call_gemini(prompt)
        if response:
            return response.strip()
        return "I'm sorry, I could not generate an answer at this moment."
    except Exception as exc:
        logger.error("RAG answer generation failed: %s", exc)
        return "I encountered an error trying to generate an answer."
