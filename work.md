# AI Voice Agent — Project Status

## Current Phase
AI Voice Workflow Foundation (Mock) — Complete

## What Was Built
### Backend (`backend/`)

#### New Models
- `models/timeline.py` — `TimelineEntry` model: tracks every status change with timestamp + note
  - FK to `orders`, cascading delete
  - Loaded eagerly with order via SQLAlchemy relationship

#### Services
- **`services/voice_service.py`** — Mock AI voice agent
  - `confirm_order()` returns random weighted outcome:
    - 50% Confirmed (with confirmation note)
    - 20% Modified (generates reasonable alternate quantity + note)
    - 20% Rejected (random rejection reason)
    - 10% Need Human (complex query reason)
  - TODO comments mark where to plug in Retell AI + LLM
- **`services/workflow_service.py`** — Background orchestrator
  - `start(order_id)` spawns a `threading.Thread` (daemon)
  - Opens its own DB session (decoupled from API request)
  - Flow: Pending → Calling (timeline entry) → sleep 5–10s → get decision → update order + timeline
  - TODO comments mark where to swap threading for Celery + webhooks
- **`services/order_service.py`** — Now auto-creates initial timeline entry on order creation

#### API Changes
- `POST /api/orders` — Triggers `WorkflowService.start(order.id)` in background, returns immediately
- `GET /api/orders` — Now includes `timeline[]` array in every order response
- `GET /api/orders/{id}` — Includes full `timeline[]` array

#### Database
- New table: `timeline_entries` (id, order_id FK, status, note, created_at)
- Old `orders.db` should be deleted for clean schema migration

### Frontend (`frontend/`)

#### Polling (3-second intervals)
- **Dashboard** — Auto-refreshes every 3s → KPIs update live as orders progress
- **Orders** — Auto-refreshes every 3s → status badges update in real-time
- **Order Details** — Auto-refreshes every 3s → timeline animates through Calling → Final status

#### Data Flow
`mapOrderFromApi` now passes through real `timeline[]` from backend (no synthetic generation)

## Current Workflow
```
Create Order (POST /api/orders)
       │
       ▼
  status = Pending, timeline = ["Order created"]
       │
       ▼ (background thread, ~1s)
  status = Calling, timeline = ["Order created", "AI agent initiated the call"]
       │
       ▼ (sleep 5–10s simulating phone call)
  Mock VoiceService randomly decides:
       │
       ├── Confirmed → "Customer confirmed the order..."
       ├── Modified  → "Customer changed quantity from X to Y"
       ├── Rejected  → "Customer declined the order..."
       └── Need Human → "Customer has complex insurance questions..."
       │
       ▼
  Order updated in SQLite with final status + notes + timeline
```

## Files Added/Modified
| File | Change |
|------|--------|
| `backend/models/timeline.py` | **New** — TimelineEntry model |
| `backend/models/order.py` | Added `timeline` relationship |
| `backend/models/__init__.py` | Exports TimelineEntry |
| `backend/schemas/order.py` | Added `TimelineEntryResponse` + `timeline` field in `OrderResponse` |
| `backend/services/voice_service.py` | **Replaced** placeholder with mock implementation |
| `backend/services/workflow_service.py` | **Replaced** placeholder with background orchestrator |
| `backend/services/order_service.py` | Added `TimelineService`, auto-creates initial timeline entry |
| `backend/api/routes/orders.py` | POST triggers `WorkflowService.start()` |
| `frontend/src/pages/Dashboard.jsx` | Added 3s polling |
| `frontend/src/pages/Orders.jsx` | Added 3s polling |
| `frontend/src/pages/OrderDetails.jsx` | Added 3s polling for live timeline |
| `frontend/src/utils/helpers.js` | Timeline now sourced from real API data |

## Future Replacement Points (TODO-marked in code)
| Current | Future |
|---------|--------|
| `threading.Thread` | Celery task with Redis broker |
| `time.sleep(5–10)` | Real webhook callback from Retell AI |
| `VoiceService.confirm_order()` random choice | Retell AI outbound call + LLM transcript parsing |
| Frontend polling (3s) | WebSocket push for instant updates |

## Next Phase
Implement real AI provider integrations:
- Wire up Retell AI for outbound calling
- LLM integration for conversation understanding
- STT (Deepgram/Whisper) + TTS (ElevenLabs)
- Replace polling with WebSocket
- Add call transcripts and conversation logging

---

## Architecture Phase — Provider Interfaces & Configuration

### What Was Added

#### Centralized Configuration (`backend/config/settings.py`)
- Full Pydantic Settings class with all env vars: App, DB, CORS, AI provider keys
- Validates required settings per provider (e.g. `AI_PROVIDER=retell` requires `RETELL_API_KEY`)
- Raises descriptive `ValueError` at startup if config is invalid
- `get_settings()` singleton via `config/__init__.py`

#### `.env.example`
- Complete with all variables across 9 sections (App, DB, CORS, Public URL, AI Provider, Retell, Twilio, n8n, Soniox, ElevenLabs, OpenAI)
- All provider keys default to empty; `AI_PROVIDER=mock` by default

#### Provider Interfaces (`backend/services/providers/`)
| File | Provider | Methods |
|------|----------|---------|
| `retell_provider.py` | Retell AI | `create_call()`, `get_call()`, `cancel_call()`, `get_transcript()` |
| `twilio_provider.py` | Twilio | `send_sms()`, `lookup_phone()`, `create_sip_trunk()` |
| `soniox_provider.py` | Soniox (STT) | `transcribe_audio()`, `transcribe_stream()` |
| `elevenlabs_provider.py` | ElevenLabs (TTS) | `synthesize_speech()`, `synthesize_stream()` |
| `llm_provider.py` | OpenAI / LLM | `analyze_transcript()`, `generate_response()` |

All providers raise `NotImplementedError` with detailed TODO comments. No API calls, no SDKs.

#### Provider Factory (`backend/services/provider_factory.py`)
- `get_voice_provider()` — Returns `VoiceService` when `AI_PROVIDER=mock`, `RetellProvider` when `AI_PROVIDER=retell`
- `get_stt_provider()` / `get_tts_provider()` / `get_llm_provider()` — Stubs returning `None` (ready for future wiring)
- Uses centralized logging instead of `print()`

#### Centralized Logging (`backend/utils/logger.py`)
- `get_logger(name)` returns configured `logging.Logger` with:
  - Timestamped console output (`2026-07-06 15:04:43 | INFO | module | message`)
  - Log level from `LOG_LEVEL` env var
  - Single handler, no duplicates on re-import
- All new code uses `logger.info()` / `logger.warning()` etc.

#### Workflow Service Updates
- Added `logger` import and `logger.info()` on Step 5 execution
- Added detailed TODO comments showing how provider factory will replace `VoiceService.run_call()`
- No existing behavior changed

#### `main.py` Updates
- Startup logging: app name, version, AI_PROVIDER, DATABASE_URL, LOG_LEVEL
- Shutdown logging on lifespan exit

### New Folder Structure
```
backend/
├── config/
│   ├── __init__.py
│   └── settings.py          ← Rewritten with full env config + validation
├── services/
│   ├── providers/           ← NEW
│   │   ├── __init__.py
│   │   ├── retell_provider.py
│   │   ├── twilio_provider.py
│   │   ├── soniox_provider.py
│   │   ├── elevenlabs_provider.py
│   │   └── llm_provider.py
│   ├── provider_factory.py  ← NEW
│   └── (existing services unchanged)
├── utils/
│   ├── __init__.py
│   ├── logger.py            ← NEW
│   └── status.py
├── .env.example             ← Rewritten with all variables
└── (existing files unchanged)
```

### Environment Variables Added
| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `LOG_LEVEL` | No | `INFO` | DEBUG, INFO, WARNING, ERROR |
| `PUBLIC_BACKEND_URL` | No | `None` | For webhooks (ngrok) |
| `AI_PROVIDER` | No | `mock` | `mock` or `retell` |
| `DEFAULT_LANGUAGE` | No | `ur` | Conversation language |
| `RETELL_API_KEY` | If retell | `None` | Retell AI API key |
| `RETELL_AGENT_ID` | If retell | `None` | Retell AI agent ID |
| `TWILIO_ACCOUNT_SID` | No | `None` | Twilio account |
| `TWILIO_AUTH_TOKEN` | No | `None` | Twilio auth |
| `TWILIO_PHONE_NUMBER` | No | `None` | Twilio number |
| `N8N_WEBHOOK_URL` | No | `None` | n8n automation |
| `SONIOX_API_KEY` | No | `None` | Soniox STT |
| `ELEVENLABS_API_KEY` | No | `None` | ElevenLabs TTS |
| `OPENAI_API_KEY` | No | `None` | OpenAI LLM |

### SOLID Compliance
- **S**: Each provider has a single responsibility (e.g. `RetellProvider` only does calls)
- **O**: New providers added via new files + factory switch — no existing code changes needed
- **L**: All providers follow the same interface pattern
- **I**: Provider interfaces are minimal and focused
- **D**: `WorkflowService` depends on factory, not on concrete providers; future swaps only change factory logic

### Current Project Status
- Backend: Running with mock provider — all existing functionality intact
- Frontend: Unchanged, builds and works
- DB: SQLite with orders, call_logs, timeline_entries tables
- Provider factory returns `VoiceService` (mock) — same as before
- No external AI services are configured or required

### Next Recommended Phase
1. Wire up `get_voice_provider()` in `WorkflowService._execute()` Step 5
2. Replace `VoiceService.run_call()` with conditional factory call
3. Implement `RetellProvider` methods with actual Retell AI API
4. Implement `LLMProvider.analyze_transcript()` with OpenAI
5. Add webhook endpoint at `/webhook/retell` to receive async call results
6. Implement `STTProvider` + `TTSProvider` for real-time conversation
7. Replace `threading.Thread` with Celery + Redis
8. Add WebSocket push for instant UI updates
