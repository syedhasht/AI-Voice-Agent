# AI Voice & Policy Agent Dashboard

A full-stack pharmaceutical order management system and AI calling control center. This project features live web-based voice simulations, a local policy-searching RAG (Retrieval-Augmented Generation) assistant, and an analytical business insights dashboard.

---

## 🚀 Overview & Architecture

This application consists of:
1. **Outbound Calling Simulator & Control Center**: Outbound voice simulations that connect directly to ElevenLabs Conversational AI over WebSockets, displaying real-time transcripts, glowing voice state visualizers, and executing client-side database callback tools.
2. **Local RAG Policy Assistant**: An intelligent, document-search tool running entirely locally. It parses standard policy PDFs (SOPs, catalogs, refund policies), generates embeddings locally, and queries a local vector database to synthesize answers using the active LLM.
3. **Enterprise AI Business Assistant**: A natural language analytical dashboard. It translates user business queries into SQL, executes them against the live database, and generates conversational insights.

---

## 🛠️ Tech Stack

* **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion, `@elevenlabs/client` (WebSocket SDK), Lucide Icons
* **Backend**: FastAPI, SQLite, SQLAlchemy ORM, Pydantic settings, `httpx`
* **Local RAG**: ChromaDB (vector database), LangChain & LangChain Community, `sentence-transformers` (local `all-MiniLM-L6-v2` embeddings model), `pypdf`
* **LLM API Providers**: Google Gemini API, Groq Cloud API (Llama 3.3 models)

---

## 🎙️ Outbound Call Simulation (Web vs. Telephony)

Because public telephony services (Twilio, Retell AI) require public webhook routing and paid outbound call credits, we implemented a **fully functional web-based voice simulation page** for testing:
* **Web Calling via WebSockets**: Clicking "Simulate Call" triggers a client-side websocket handshake using the `@elevenlabs/client` SDK. This lets you talk to the AI directly through your computer microphone/speakers in real-time, mimicking a phone call.
* **Client-Side Tool Call Delegation (`clientTools`)**: When the AI decides to perform a database operation (confirm order, cancel order, update quantity, or request human help), it executes a client-side tool call. The React browser intercepts this request and writes updates directly to your local FastAPI server and SQLite database, solving webhook constraints on localhost.

---

## 🤖 AI Assistant integrations

The dashboard includes two separate, highly isolated assistants:

### 1. Enterprise AI Assistant (NL → SQL → Insights)
* **Goal**: Converts questions like *"What is the revenue in the last 5 days?"* into queries.
* **Stateless Querying**: Generates precise SQLite queries, validates them for security (permits only SELECT queries), executes them, formats data tables, and graphs results.
* **Conversational Fallback**: Questions that cannot be answered from the database schema (such as *"how is the weather?"*) are intercepted and answered politely by the LLM instead of throwing SQL errors.
* **Multi-LLM Provider Switching**: Supports both **Google Gemini** and **Groq Cloud (Llama 3.3)**. You can switch providers instantly in your `.env` configuration file without modifying code.

### 2. Local RAG Policy Assistant
* **Goal**: Answers questions about company policies, refund terms, and SOP guidelines.
* **Local Embedding Models**: Uses HuggingFace's `all-MiniLM-L6-v2` to compute vector embeddings locally, requiring zero API costs or network bandwidth.
* **Lazy Loading & Memory Optimization**: The heavy machine learning models (PyTorch/sentence-transformers) are **not** loaded at server startup. The vector database is initialized lazily **only when the RAG page is first queried**.
* **Thread-Safe Double-Checked Locking**: Thread-safe locks prevent concurrency errors or multiple write locks on ChromaDB when accessed across multiple open browser tabs.
* **Model Cache**: Caches the embeddings model globally in memory so subsequent queries process in milliseconds.
* **Synthesized Answers**: Automatically feeds matching chunks to the active LLM (Gemini or Groq) to draft a concise, conversational answer, listing the specific PDF source document names dynamically.

---

## 💾 Database & Customer Uniqueness

To support realistic commerce operations, the database schemas were restructured:
* **Unique Customers**: The `Customer` model's primary key is mapped to `phone_number`. This prevents customer duplicates; when a repeat phone number is used for an order, it automatically links it to the customer's previous historical ID, creating new customer records only for first-time buyers.
* **Extended Schema**: Added support for customer addresses and sequential code values (`CUST-XXXXXX`). Order details views display both the unique customer code and delivery address cleanly.

---

## ⚙️ Getting Started

### 1. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Activate your virtual environment and install the Python dependencies:
   ```bash
   # On Windows
   .venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```
3. Set up your `.env` file credentials:
   ```env
   # Voice Simulator API Key
   ELEVENLABS_API_KEY=sk_...
   ELEVENLABS_AGENT_ID=agent_...

   # LLM Provider Configuration (gemini or groq)
   AI_ASSISTANT_PROVIDER=groq
   GROQ_API_KEY=gsk_...
   GEMINI_API_KEY=AIzaSy...
   ```
4. Start the FastAPI server:
   ```bash
   python -m uvicorn main:app --reload
   ```

### 2. Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install npm packages and start the Vite dev server:
   ```bash
   npm install
   npm run dev
   ```
3. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📂 Project Structure
* `/backend/api/routes` — REST endpoints (orders, analytics, calls, RAG queries, assistant queries).
* `/backend/services/rag` — Document parsing, local embeddings initialization, Chroma database.
* `/backend/services/ai_assistant` — SQL translation engines and text synthesis logic.
* `/frontend/src/pages` — Core screens: `VoiceSession` (live call simulator), `RAGAssistant`, `AIAssistant`, `Orders`, `Settings`.
* `/frontend/src/components/common` — Custom reusable design library (Cards, Buttons, Badges, Modals).

---

## 📄 License
[MIT License](LICENSE)