# OpenClaw: General-Purpose Agentic Engine

## Project Mission
OpenClaw is a flexible, autonomous agentic engine designed for serverless environments. It enables high-speed reasoning and system-level operations via a stateless API.

## Core Identity
- **Name**: OpenClaw
- **Version**: 4.1 (Generalized)
- **Engine**: Node.js / Groq / Gemini

## Capabilities
- **Natural Chat**: Capable of standard conversation without forced tool usage.
- **System Integration**: Authorized for host system interaction via shell and file tools.
- **Web Research**: Integrated Google Search and URL fetching.
- **Efficient Reasoning**: Brief, focused plan explanation before actions.

## Operational Mandates
- **Push Everytime**: Continuous deployment to Vercel via GitHub.
- **GitHub Push Command**: `git push https://saad-pie:<PAT>@github.com/saad-pie/OpenClaw-Serverless.git main`
- **Stateless**: The Brain (API) maintains no local state; state is managed via `history` in requests.
- **Standardized Tools**: Uses a consistent set of tools (`execute_shell`, `read_write_file`, `google_search`, etc.).
- **Neutral Branding**: Identifies as OpenClaw.

## Workflow
1. **Client** sends `message` + `history` to the API.
2. **API (Brain)** returns reasoning and `tool_calls`.
3. **Client (Wristband)** executes `tool_calls` and updates `history`.
4. **Loop** repeats until the task is complete (marked by `submit_answer` or no more tool calls).

## Setup
- **API:** Deploy to Vercel. Set `GROQ_API_KEY`.
- **Client:** Use `client.ts` or any compatible executor.

---
*Note: This file is used to maintain project context.*
