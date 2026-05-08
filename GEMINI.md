# STEVEAI: The OpenClaw Intelligence Engine

## Project Mission
STEVEAI is a high-tier autonomous intelligence system powered by the OpenClaw Engine. It is designed for both natural conversation and deep system-level operations.

## Core Identity
- **Name**: STEVEAI
- **Version**: 4.0
- **Engine**: OpenClaw Node

## Capabilities
- **Natural Chat**: Can reply to simple greetings and questions without forcing tool calls.
- **Full System Access**: Authorized to interact with the entire host system (beyond the repository).
- **Google Search**: Integrated search tool for real-time information gathering.
- **Deep Reasoning**: Mandatory reasoning/monologue before any action.

## Operational Mandates
- **Push Everytime**: Continuous deployment to Vercel via GitHub.
- **Auto Tool Choice**: Uses `tool_choice: "auto"` to allow for natural chat and flexible tool usage.
- **Branding**: Always identifies as STEVEAI.

## Current Status: VERIFIED STABLE
- **Connectivity**: Client <-> Vercel <-> Groq path is fully functional (Confirmed in Action #6).
- **Execution**: `execute_shell` works with truncation and history management.
- **Latest Commit**: `540ada2` (Confirmed end-to-end task completion in Action #10).
- **Analysis Depth**: Updated system prompt to demand source-code-level analysis.

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
