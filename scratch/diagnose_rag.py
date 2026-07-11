import sys
import traceback
from pathlib import Path

# Add backend directory to path so imports work correctly
backend_dir = str(Path(__file__).resolve().parents[1] / "backend")
sys.path.insert(0, backend_dir)

# Now import RAG services
from services.rag.rag_service import search_documents, generate_rag_answer

print("Initializing RAG...")
try:
    from services.rag.rag_service import initialize_rag
    initialize_rag()
    print("Initialization complete.")
except Exception as e:
    print("Initialization failed:")
    traceback.print_exc()

print("\nRunning RAG Search...")
try:
    question = "What is the refund policy?"
    matches = search_documents(question)
    print(f"Search complete. Found {len(matches)} matches.")
    for idx, match in enumerate(matches):
        print(f"Match {idx+1}: {match.get('document')} - Score {match.get('score')}")
    
    print("\nGenerating RAG Answer...")
    answer = generate_rag_answer(question, matches)
    print("Answer:")
    print(answer)
except Exception as e:
    print("RAG execution failed:")
    traceback.print_exc()
