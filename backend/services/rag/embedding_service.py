from langchain_community.embeddings import HuggingFaceEmbeddings


_embedding_model = None


def get_embedding_model():
    """
    Returns the local SentenceTransformers embedding function
    using the all-MiniLM-L6-v2 model. Runs entirely locally and caches the instance.
    """
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2"
        )
    return _embedding_model
