import glob
from pathlib import Path
from typing import List

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

from utils.logger import get_logger

logger = get_logger(__name__)


def load_and_split_documents(documents_dir: Path) -> List[Document]:
    """
    Loads all PDF documents from documents_dir, extracts text,
    and splits them into overlapping chunks.
    """
    documents = []
    pdf_files = list(documents_dir.glob("*.pdf"))

    if not pdf_files:
        logger.warning("No PDF files found in %s", documents_dir)
        return []

    logger.info("Found %d PDF file(s) for loading", len(pdf_files))

    for pdf_path in pdf_files:
        try:
            logger.info("Loading PDF: %s", pdf_path.name)
            loader = PyPDFLoader(str(pdf_path))
            pages = loader.load()
            
            # Ensure document source metadata is clean (just filename)
            for page in pages:
                page.metadata["source"] = pdf_path.name
                
            documents.extend(pages)
            logger.info("Loaded %d page(s) from %s", len(pages), pdf_path.name)
        except Exception as exc:
            logger.error("Failed to load PDF %s: %s", pdf_path.name, exc)

    if not documents:
        return []

    # Split documents into chunks
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=150
    )
    chunks = splitter.split_documents(documents)
    logger.info("Split %d pages into %d text chunks", len(documents), len(chunks))
    return chunks
