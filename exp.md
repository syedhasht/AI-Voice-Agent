# AI Voice & Policy Agent Dashboard — Technical Architecture & Workflow Guide

This document provides a comprehensive technical overview of the AI Voice & Policy Agent Dashboard application. It maps the overall workflows, describes how components interact across the stack, and details the role of every significant file in the project.

---

## 🚀 1. High-Level Architecture

The application is a full-stack system comprising a **React 19 Frontend (Vite + Tailwind CSS)** and a **FastAPI Backend (Python + SQLAlchemy + SQLite)**. It implements three core functional areas:
1. **Real-time Outbound Calling Simulation**: Web-based speech-to-speech simulator connected to ElevenLabs Conversational AI over WebSockets with browser-delegated database updates.
2. **Local RAG Policy Assistant**: Document search system using a local Chroma vector database and Google Gemini API for embeddings and response generation.
3. **Enterprise AI Business Analyst**: Natural language assistant converting business questions into safe SQLite queries, executing them, generating charts, and synthesizing conversational summaries.

```mermaid
graph TD
    %% Frontend Layer
    subgraph Frontend [React 19 App / Vite]
        UI[pages/Dashboard, pages/NeedHuman, pages/AIAssistant, pages/RAGAssistant]
        API_Client[services/api.js & client.js]
        Voice_SDK[@elevenlabs/client SDK]
    end

    %% Backend Layer
    subgraph Backend [FastAPI / Uvicorn]
        API_Router[api/routes - orders, calls, rag, assistant, dashboard]
        RAG_Service[services/rag - RAG Engine]
        NL_SQL_Service[services/ai_assistant - SQL Engine]
        DB_Layer[database/session.py & models/]
    end

    %% External API Services
    subgraph External [External Services]
        ElevenLabs[ElevenLabs WebSocket API]
        Gemini[Google Gemini API]
        Groq[Groq Llama 3.3 API]
    end

    %% Connections
    UI --> API_Client
    UI --> Voice_SDK
    Voice_SDK <-->|WebSocket| ElevenLabs
    API_Client <-->|HTTP REST| API_Router
    
    API_Router --> RAG_Service
    API_Router --> NL_SQL_Service
    API_Router --> DB_Layer
    
    RAG_Service <-->|REST API| Gemini
    NL_SQL_Service <-->|REST API| Gemini/Groq
    RAG_Service <-->|Local Storage| Chroma[(ChromaDB)]
    DB_Layer <-->|Local Storage| SQLite[(orders.db)]
```

---

## 🔄 2. Core Workflows & Life-Cycles

### 🎙️ Workflow A: Outbound Call Simulation
To bypass webhook constraints when running on local host, the system employs **Browser-Side Tool Delegation (`clientTools`)**:
1. **Handshake**: The user goes to the calling page and clicks "Simulate Call". The frontend initiates a WebSocket connection with ElevenLabs using the `@elevenlabs/client` SDK.
2. **Conversation**: The user speaks into the microphone; ElevenLabs processes the stream and plays back responses in real-time.
3. **Database Tool Call**: If the user confirms, modifies, or cancels an order, or requests human help, the ElevenLabs agent triggers a tool execution.
4. **Browser Interception**: The `@elevenlabs/client` browser session intercepts this tool call.
5. **Database Sync**: The React frontend sends an HTTP request (`POST /api/agent-tools/...`) to the local FastAPI server. The backend updates the SQLite database state, and the UI immediately reflects the changes (e.g., order status transitioning to `CONFIRMED` or call logged as `Escalated`).

---

### 📖 Workflow B: Lazy-Loaded RAG Policy Assistant
To minimize memory overhead, heavy vector operations are only initialized when first requested:
1. **Lazy Loading Check**: When a POST query arrives at `/api/rag/query`, the RAG service uses a thread-safe double-checked lock (`_rag_init_lock`) to verify if database indexing has run.
2. **Document Loading**: On first run, it scans the `backend/documents/` folder for PDFs (`SOP.pdf`, `Medicine Catalog.pdf`, `Exchange and Refund Policy.pdf`), parses their text using `PyPDFLoader`, and divides them into overlapping blocks (chunk size: 800, overlap: 150) using a `RecursiveCharacterTextSplitter`.
3. **Vector Generation**: Text chunks are sent to Google's REST embeddings API (`models/gemini-embedding-001`) to generate 768-dimensional vector representations.
4. **Persistence**: Vector embeddings are saved locally in the Chroma DB directory `backend/chroma_db/`.
5. **Retrieval**: The system queries Chroma to find the top 5 most relevant segments using cosine similarity.
6. **Synthesis**: The question and matching segments are formatted into a system prompt and dispatched to the active LLM (Gemini or Groq) to synthesize a concise, source-attributed answer.

---

### 📊 Workflow C: Enterprise AI Assistant (NL → SQL → Insights)
This pipeline converts open-ended business queries into validated database insights:
1. **Routing**: The user submits a query to `/api/assistant/query`.
2. **Conversational Fallback**: The backend classifies the input. Greeting or generic queries (e.g., "Hi", "How are you?") are intercepted and replied to directly by the LLM without touching the database.
3. **SQL Translation**: If it is a business query, the `sql_generator` inputs the database schema definitions (Tables: `orders`, `customers`, `medicines`, `calls`, `voice_sessions`, `ai_agents`) and generates an SQLite SELECT query using the active LLM (Gemini or Groq).
4. **Validation**: The SQL string is parsed by the `sql_validator`. Any query containing destructive operations (e.g., `INSERT`, `UPDATE`, `DELETE`, `DROP`) is rejected.
5. **Execution**: The database query is executed on `orders.db` by `sql_executor`, which extracts data rows and columns.
6. **Chart Selection**: The `chart_selector` evaluates columns and data patterns to recommend a matching visualization (e.g., `Bar`, `Line`, `Pie`, or `None` if data is not chartable).
7. **Business Summary**: The `explanation_service` feeds the raw database rows and the original question to the LLM to draft a concise, conversational business analysis (automatically formatting currencies in PKR `Rs.`).

---

## 📂 3. Directory Structure & File Mapping

### 🖥️ Frontend Files (`/frontend`)

* [package.json](file:///c:/Users/hashi/OneDrive/Desktop/AI%20Voice%20Agent/frontend/package.json): Lists frontend library dependencies, including **React 19**, **Vite** (build system), **Tailwind CSS** (styling), **Framer Motion** (animations), **Lucide React** (icons), and **Recharts** (SVG charts).
* [index.html](file:///c:/Users/hashi/OneDrive/Desktop/AI%20Voice%20Agent/frontend/index.html): Entry HTML document. Configured with Google Font preconnect link tags to fetch the `Inter` font family in parallel.
* [src/index.css](file:///c:/Users/hashi/OneDrive/Desktop/AI%20Voice%20Agent/frontend/src/index.css): Core global styling sheet. Declares the Tailwind CSS custom design token system (Teal/Emerald/Amber palette) and utility styles (`card`, `glass`, `status-badge`, `skeleton-pulse`).
* [src/services/client.js](file:///c:/Users/hashi/OneDrive/Desktop/AI%20Voice%20Agent/frontend/src/services/client.js): Configures the central **Axios** HTTP client instance. Specifies the base API path, request headers, and intercepts response errors (e.g., mapping connection aborts to timed-out exceptions).
* [src/services/api.js](file:///c:/Users/hashi/OneDrive/Desktop/AI%20Voice%20Agent/frontend/src/services/api.js): Exposes structured API methods wrapping standard endpoints (orders, dashboard, analytical queries, RAG search). Specifying extended timeouts (`90000ms`) for RAG and analytical queries to prevent aborts during cold starts.
* [src/pages/Dashboard.jsx](file:///c:/Users/hashi/OneDrive/Desktop/AI%20Voice%20Agent/frontend/src/pages/Dashboard.jsx): The landing dashboard screen. Fetches telemetry summaries, sets up a 5-second automatic refresh timer, renders visual KPIs (Customers, Orders, Daily Calls, Sales, Rates), and renders Recharts visualizations.
* [src/pages/NeedHuman.jsx](file:///c:/Users/hashi/OneDrive/Desktop/AI%20Voice%20Agent/frontend/src/pages/NeedHuman.jsx): Renders the **Escalated Calls** dashboard. Queries the backend for call records marked with a `need_human` outcome, lets users inspect logs and transcripts, and displays drawer panels with call detail metrics.
* [src/pages/AIAssistant.jsx](file:///c:/Users/hashi/OneDrive/Desktop/AI%20Voice%20Agent/frontend/src/pages/AIAssistant.jsx): Interactive terminal UI for the Enterprise assistant. Displays chat feeds, executes queries, formats output tables dynamically, and draws recommended charts matching the data format.
* [src/pages/RAGAssistant.jsx](file:///c:/Users/hashi/OneDrive/Desktop/AI%20Voice%20Agent/frontend/src/pages/RAGAssistant.jsx): Question-answering dashboard for RAG queries. Prompts the vector database, renders extracted PDF source segments, and prints conversational summaries alongside source citations.
* [src/components/layout/Sidebar.jsx](file:///c:/Users/hashi/OneDrive/Desktop/AI%20Voice%20Agent/frontend/src/components/layout/Sidebar.jsx): Main navigation sidebar. Maps page routes, rendering icons (`Bot`, `Phone`, `BookOpen`, `Headphones`), active states, and custom transitions.

---

### ⚙️ Backend Files (`/backend`)

* [main.py](file:///c:/Users/hashi/OneDrive/Desktop/AI%20Voice%20Agent/backend/main.py): Application server root. Configures FastAPI, sets up CORS permission rules, maps standard API routers, handles global exception captures, and runs database migrations and seeds inside the lifespan event cycle.
* [requirements.txt](file:///c:/Users/hashi/OneDrive/Desktop/AI%20Voice%20Agent/backend/requirements.txt): Lists Python library requirements, mapping FastAPI, Uvicorn, SQLAlchemy (database connectivity), ChromaDB, and LangChain (vector utilities).
* [config/settings.py](file:///c:/Users/hashi/OneDrive/Desktop/AI%20Voice%20Agent/backend/config/settings.py): Centralized configuration loader. Uses Pydantic Settings to automatically parse and validate the [backend/.env](file:///c:/Users/hashi/OneDrive/Desktop/AI%20Voice%20Agent/backend/.env) environment variables (API credentials, active database URL, and models).
* [database/session.py](file:///c:/Users/hashi/OneDrive/Desktop/AI%20Voice%20Agent/backend/database/session.py): Handles SQLAlchemy database engine setup, pool configurations, and session creation (`SessionLocal`).
* [models/](file:///c:/Users/hashi/OneDrive/Desktop/AI%20Voice%20Agent/backend/models/):
  - [models/customer.py](file:///c:/Users/hashi/OneDrive/Desktop/AI%20Voice%20Agent/backend/models/customer.py): Defines the `Customer` table, mapping phone numbers as unique keys to prevent duplicate user profiles.
  - [models/order.py](file:///c:/Users/hashi/OneDrive/Desktop/AI%20Voice%20Agent/backend/models/order.py): Defines the `Order` table, storing order status (`pending`, `confirmed`, `rejected`, `need_human`), medication links, and conversation identifiers.
  - [models/call.py](file:///c:/Users/hashi/OneDrive/Desktop/AI%20Voice%20Agent/backend/models/call.py): Defines the `Call` table, storing duration, sentiments, confidence scores, and call outcomes.
* [api/routes/](file:///c:/Users/hashi/OneDrive/Desktop/AI%20Voice%20Agent/backend/api/routes/):
  - [api/routes/dashboard.py](file:///c:/Users/hashi/OneDrive/Desktop/AI%20Voice%20Agent/backend/api/routes/dashboard.py): Exposes statistical aggregations (daily call rates, revenue totals, escalated call volumes) to feed dashboard metrics and charting modules.
  - [api/routes/agent_tools.py](file:///c:/Users/hashi/OneDrive/Desktop/AI%20Voice%20Agent/backend/api/routes/agent_tools.py): API endpoint receiving client-side tool executions from the ElevenLabs browser session, translating them to database status changes.
  - [api/routes/rag_routes.py](file:///c:/Users/hashi/OneDrive/Desktop/AI%20Voice%20Agent/backend/api/routes/rag_routes.py): POST router exposing RAG search services, querying text chunks, and running synthesis models.
  - [api/routes/assistant_routes.py](file:///c:/Users/hashi/OneDrive/Desktop/AI%20Voice%20Agent/backend/api/routes/assistant_routes.py): Endpoint routing the Natural Language to SQL analytics tool.
* [services/rag/](file:///c:/Users/hashi/OneDrive/Desktop/AI%20Voice%20Agent/backend/services/rag/):
  - [services/rag/rag_service.py](file:///c:/Users/hashi/OneDrive/Desktop/AI%20Voice%20Agent/backend/services/rag/rag_service.py): Core RAG service. Orcherstrates vector collection searches and prompt formatting templates.
  - [services/rag/document_loader.py](file:///c:/Users/hashi/OneDrive/Desktop/AI%20Voice%20Agent/backend/services/rag/document_loader.py): Locates source PDF manuals, extracts content, and partitions text into overlapping snippets.
  - [services/rag/vector_store.py](file:///c:/Users/hashi/OneDrive/Desktop/AI%20Voice%20Agent/backend/services/rag/vector_store.py): Initializes Chroma DB database engines, configuring telemetries and vector writes.
  - [services/rag/embedding_service.py](file:///c:/Users/hashi/OneDrive/Desktop/AI%20Voice%20Agent/backend/services/rag/embedding_service.py): Custom REST embedding generator. Communicates with Google's cloud embeddings engine (`models/gemini-embedding-001`) via HTTP requests.
* [services/ai_assistant/](file:///c:/Users/hashi/OneDrive/Desktop/AI%20Voice%20Agent/backend/services/ai_assistant/):
  - [services/ai_assistant/ai_assistant_service.py](file:///c:/Users/hashi/OneDrive/Desktop/AI%20Voice%20Agent/backend/services/ai_assistant/ai_assistant_service.py): Master workflow controller coordinating translation, validations, database execution, charting selection, and analytics synthesis.
  - [services/ai_assistant/sql_generator.py](file:///c:/Users/hashi/OneDrive/Desktop/AI%20Voice%20Agent/backend/services/ai_assistant/sql_generator.py): Formulates schema context instructions and prompt queries for translation into SQLite syntax.
  - [services/ai_assistant/sql_validator.py](file:///c:/Users/hashi/OneDrive/Desktop/AI%20Voice%20Agent/backend/services/ai_assistant/sql_validator.py): Assures queries are safe SELECT queries and filters out write or administrative database queries.
  - [services/ai_assistant/sql_executor.py](file:///c:/Users/hashi/OneDrive/Desktop/AI%20Voice%20Agent/backend/services/ai_assistant/sql_executor.py): Executes queries on database engines, extracting column metadata and list rows.
  - [services/ai_assistant/chart_selector.py](file:///c:/Users/hashi/OneDrive/Desktop/AI%20Voice%20Agent/backend/services/ai_assistant/chart_selector.py): Analyzes shape and properties of results sets, choosing target Recharts models.
  - [services/ai_assistant/explanation_service.py](file:///c:/Users/hashi/OneDrive/Desktop/AI%20Voice%20Agent/backend/services/ai_assistant/explanation_service.py): Feeds data matrices to LLMs (Gemini/Groq) to form conversational summaries.
