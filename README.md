# AI Voice Agent

A full-stack application for managing and deploying AI-powered voice agents using Retell AI and Twilio.

## Overview
This project provides a complete infrastructure for outbound/inbound AI phone calls, featuring a robust backend for handling voice interactions and a beautiful frontend for managing the agent's dashboard, settings, and call logs.

## Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS 4, Framer Motion
- **Backend**: FastAPI, SQLAlchemy, Pydantic
- **AI/Telephony**: Retell AI, Twilio

## Project Structure
- `/frontend`: Modern React application for the user interface and call visualization.
- `/backend`: Python FastAPI server managing REST endpoints, database sessions, and webhooks for telephony providers.

## Getting Started

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## License
[MIT License](LICENSE)