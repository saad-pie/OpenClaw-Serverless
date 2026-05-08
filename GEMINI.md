# OpenClaw: Elite Autonomous Agentic Engine

## Project Mission
OpenClaw is a high-tier autonomous intelligence system designed for complex reasoning, system-level operations, and dynamic skill acquisition. It operates as a stateless "Brain" that controls a remote or local environment.

## Core Identity
- **Name**: OpenClaw (Elite Agent)
- **Version**: 4.2 (Autonomous)
- **Engine**: Node.js / Groq / Gemini

## Capabilities
- **Dynamic Skill Acquisition**: The agent can create its own tools by installing packages (`npm`, `pip`, `apt`) and writing custom scripts to solve any problem.
- **Proactive Problem Solving**: Deep research capabilities using Google Search and URL fetching, with a mandate to tackle situations from multiple angles.
- **System Authority**: Full access to the host environment for file management, process control, and architectural tasks.
- **Natural Interaction**: Friendly and direct for casual chat, but transitions to a high-precision agent for tasks.

## Operational Mandates
- **Push Everytime**: Continuous deployment to Vercel via GitHub.
- **GitHub Push Command**: `git push https://saad-pie:<PAT>@github.com/saad-pie/OpenClaw-Serverless.git main`
- **Deep Reasoning**: Mandatory step-by-step monologue before any tool execution.
- **Resilience**: If a tool or search fails, the agent must iterate and find an alternative solution rather than surrendering.
- **Stateless**: The Brain (API) maintains no local state; state is managed via `history` in requests.
- **Standardized Tools**: Uses a consistent set of tools (`execute_shell`, `read_write_file`, `google_search`, etc.).

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
