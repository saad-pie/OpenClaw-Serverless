# OpenClaw Serverless API

This is the backend for the OpenClaw Agentic Wristband system. It uses Groq's high-speed inference to power the agentic logic.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run locally:
   ```bash
   npm run dev
   ```

## API Endpoints

### POST `/api/agent`
The main endpoint for the OpenClaw agent. Supports tool-calling for task execution.

**Body:**
```json
{
  "message": "Remind me to charge my wristband at 8 PM",
  "history": []
}
```

**Response:**
Returns the assistant's message and any tool calls (tasks) that need to be performed.

### POST `/api/chat`
A simple proxy for direct chat messages using the Groq model.

## Model Configuration
Currently configured to use: `openai/gpt-oss-120b` (as requested).
*Note: If this model ID is invalid on Groq, update `.env` with a supported model like `llama3-70b-8192`.*

## Security
The Groq API key is stored in `.env` and is never exposed to the client. The serverless functions handle all communication with Groq securely.
