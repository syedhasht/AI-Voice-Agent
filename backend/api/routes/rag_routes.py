from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

from services.rag import search_documents, generate_rag_answer

router = APIRouter(prefix="/rag", tags=["RAG"])


class QueryRequest(BaseModel):
    question: str


class MatchResponse(BaseModel):
    document: str
    page: int
    score: float
    text: str


class QueryResponse(BaseModel):
    question: str
    answer: str
    matches: List[MatchResponse]


@router.post("/query", response_model=QueryResponse)
def query_rag_endpoint(data: QueryRequest):
    """
    Retrieves the most relevant PDF document chunks matching the user's question,
    and uses the active LLM to generate a synthesized natural language answer.
    """
    question = data.question.strip()
    if not question:
        return QueryResponse(question="", answer="Please enter a valid question.", matches=[])
        
    matches = search_documents(question)
    answer = generate_rag_answer(question, matches)
    
    return QueryResponse(
        question=question,
        answer=answer,
        matches=[MatchResponse(**m) for m in matches]
    )
