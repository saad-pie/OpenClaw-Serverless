# OpenClaw: Split-Architecture Autonomous Agent

## Project Mission
OpenClaw is a distributed autonomous agent system. It separates "Reasoning" (Server) from "Execution" (Client).

## Core Architecture
- **Brain (Vercel):** An Express API hosted on Vercel that interfaces with Groq. It receives history, plans tasks, and returns `tool_calls`.
- **Wristband (GitHub Actions/Local):** A TypeScript client (`client.ts`) that polls the Brain, executes shell commands/file operations, and reports results back.

## Components
1. **Server (`/api/agent`)**: The stateless reasoning endpoint.
2. **Client (`client.ts`)**: The stateful executor that runs where you need it (Local, GitHub Actions, etc.).

## Operational Mandates
- **Push Everytime**: Every modification (fix, feature, or doc update) MUST be committed and pushed to GitHub immediately to trigger Vercel redeployment.
- **Truncation**: Client MUST truncate large outputs (>2000 chars) to protect LLM token limits.
- **Routing**: Always target the base URL; `vercel.json` handles the internal routing.

## Workflow
1. **Client** sends `message` + `history` to Vercel.
2. **Vercel** returns thoughts and `tool_calls`.
3. **Client** executes `tool_calls` and updates `history`.
4. **Loop** repeats until the task is complete.

## Setup
- **Vercel:** Deploy the root folder to Vercel. Set `GROQ_API_KEY`.
- **Client:** Run `npx tsx client.ts "Your Task Here"`.
- **GitHub Actions:** Use the provided workflow to run tasks in CI.

---
*Note: This file is used by Gemini CLI to maintain context across sessions.*
