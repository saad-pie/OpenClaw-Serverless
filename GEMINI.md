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
- **Deployment Fix**: `vercel.json` was updated to remove `outputDirectory: "dist"` and add rewrites. This ensures Vercel treats the project as a Serverless Function rather than a static site.
- **Routing Fix**: `api/index.ts` now listens for POST requests on both `/` and `/api/agent`. This fixes the 404 error when the client hits the base URL.
- **Tools**: Supports `execute_shell` (full bash access) and `read_write_file`.
- **LLM**: Configured for Groq with model `openai/gpt-oss-120b` (fallback).
- **Environment**: Requires `GROQ_API_KEY` on server and `OPENCLAW_API_URL` on client.

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
