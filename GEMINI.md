# OpenClaw: Split-Architecture Autonomous Agent

## Project Mission
OpenClaw is a distributed autonomous agent system. It separates "Reasoning" (Server) from "Execution" (Client).

## Core Architecture
- **Brain (Vercel):** An Express API hosted on Vercel that interfaces with Groq. It receives history, plans tasks, and returns `tool_calls`.
- **Wristband (GitHub Actions/Local):** A TypeScript client (`client.ts`) that polls the Brain, executes shell commands/file operations, and reports results back.

## Components
1. **Server (`/api/agent`)**: The stateless reasoning endpoint.
2. **Client (`client.ts`)**: The stateful executor that runs where you need it (Local, GitHub Actions, etc.).

## Analysis (May 2026 Refresh)
- **Deployment Fix**: `vercel.json` updated with rewrites to route all traffic to `/api`.
- **Routing Fix**: `api/index.ts` now handles POST on `/` and `/api/agent`.
- **Automated Workflow**: Configured to push fixes directly to `saad-pie/OpenClaw-Serverless` using PAT.
- **Latest Commit**: `d57f62a` (Fix Vercel 404 and routing).

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
