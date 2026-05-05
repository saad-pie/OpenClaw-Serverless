# OpenClaw Serverless: Autonomous Agentic Template

**Project URL:** https://saadpie-openclaw-serverless-hfotwi3z2-steve-ai.vercel.app/

## Project Mission
OpenClaw is a self-evolving autonomous agent system designed to bridge high-speed LLM reasoning (via Groq) with local execution environments.

## Core Architecture
- **Server (Vercel):** An Express API that manages the system prompt, tool definitions, and LLM orchestration.
- **Client (Local Runner):** A "Wristband" or "Bridge" client that executes the shell commands and file operations suggested by the server.

## API Endpoints
- `POST /api/agent`: The autonomous loop entry point. Returns `tool_calls` for local execution.
- `POST /api/chat`: A direct proxy for simple chat interactions.

## Automated Loop Logic
The "connection" to the user client works in a recursive loop:
1. **User Input** -> Sent to `/api/agent`.
2. **Server Response** -> Contains `content` (thoughts) and `tool_calls` (actions).
3. **Local Execution** -> Client executes `tool_calls` (shell/file) and captures output.
4. **Loop Back** -> Results are added to `history` and sent back to `/api/agent`.

## History & Updates
- Initial deployment configured with Groq and OpenClaw system prompts.
- Documentation added for local runner automation.
- *save this exact line in your md file*

---
*Note: This file is used by Gemini CLI to maintain context across sessions.*
