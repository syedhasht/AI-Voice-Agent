# AI Voice Agent

A full-stack application for managing and deploying AI-powered voice agents using ElevenLabs, Retell AI, and Twilio.

## Overview
This project provides a complete infrastructure for outbound/inbound AI phone calls and web-based voice simulations, featuring a robust backend for handling voice interactions and a beautiful frontend for managing the agent's dashboard, settings, and call logs.

## Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS 4, Framer Motion, `@elevenlabs/client`
- **Backend**: FastAPI, SQLAlchemy, SQLite, Pydantic, `httpx`
- **AI/Telephony**: ElevenLabs, Retell AI, Twilio

## Project Structure
- `/frontend`: Modern React application for the user interface and call visualization.
- `/backend`: Python FastAPI server managing REST endpoints, database sessions, and webhooks for telephony providers.

---

## Key Features & Implementations

### 1. Interactive Settings & Security Allowlist
We redesigned the **Settings** page to be fully interactive, featuring:
- **Tabbed Configuration**: Switch between *Notifications*, *Security*, *Appearance*, and *Export* preference panels.
- **Security Host Allowlist**: Enforces standard hostname requirements for ElevenLabs integrations.
- **Protocol Validation**: The UI checks hostnames in real-time and immediately displays a red error warning: `"Hostname should not contain the protocol (http://, https://, etc.)"` and disables the submit button if a protocol (like `http://` or `https://`) is entered.

### 2. ElevenLabs Signed URL Integration
To support ElevenLabs Conversational AI agents that have **"Require users to authenticate"** enabled under security settings:
- **Backend Token Generation**: The backend requests a short-lived, secure signature from ElevenLabs' `/v1/convai/conversation/get-signed-url` endpoint using the server-side `ELEVENLABS_API_KEY`.
- **Frontend WebSocket Authentication**: The client-side React code reads the `signed_url` returned from the backend and initializes `Conversation.startSession({ signedUrl })` without exposing private API keys to the browser.

### 3. StrictMode Double-Mount Guard
React 19 in development mounts components twice to assert hook safety, which normally initiates two concurrent WebSocket sessions. This was causing ElevenLabs to drop the connection immediately with a `WebSocket is already in CLOSING or CLOSED state` error. 
- **Fix**: Added a React `useRef` mount guard (`hasStartedRef`) in `VoiceSession.jsx` to guarantee that `Conversation.startSession` is only called once per lifecycle.

### 4. Client-Side Tool Call Delegation (`clientTools`)
Because a local dev server (`localhost:8000`) cannot receive inbound webhook requests directly from ElevenLabs' public cloud servers, we bridged local SQLite updates through the browser:
- The React client registers local callback handlers (`clientTools`) within `Conversation.startSession()`.
- When the voice agent decides to execute a tool (e.g. confirming, modifying quantity, or cancelling the order), the browser intercepts the call and runs a local HTTP request against the FastAPI server.
- Supported operations:
  - **Confirm Order** (`confirm_order` / `confirm-order`) -> Updates order status to `completed` in SQLite.
  - **Modify Order** (`modify_order` / `modify-order`) -> Updates the quantity of medicine in SQLite.
  - **Cancel Order** (`cancel_order` / `cancel-order`) -> Rejects the order in SQLite.
  - **Request Human Escalation** (`request_human` / `request-human`) -> Flags order status as `need_human`.

### 5. Loopback & Hostname Configuration
- Configured Vite (`vite.config.js`) with `server: { host: true }` to listen on all network interfaces (`0.0.0.0`), allowing loopback domains like `lvh.me` and custom hosts to easily bind to the development environment.

---

## Getting Started

### 1. Backend Setup
1. Move to the backend folder:
   ```bash
   cd backend
   ```
2. Install the Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Make sure to define your ElevenLabs API credentials in `backend/.env`:
   ```env
   ELEVENLABS_API_KEY=sk_...
   ELEVENLABS_AGENT_ID=agent_...
   ```
4. Run the development server:
   ```bash
   python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```

### 2. Frontend Setup
1. Move to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install the npm packages:
   ```bash
   npm install
   ```
3. Start the Vite server:
   ```bash
   npm run dev
   ```
4. Open the application at: [http://localhost:5173](http://localhost:5173)

## License
[MIT License](LICENSE)