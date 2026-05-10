# OpenClaw: Google AI Studio Integration Guide

This guide explains how to set up **OpenClaw** inside Google AI Studio using the Gemini 1.5 Pro/Flash models. This allows you to use Gemini's advanced reasoning as the "Brain" while maintaining the "Wristband" execution capabilities.

## 1. System Instructions (The "Prompt")
Copy and paste this into the **System Instructions** block in Google AI Studio:

```markdown
You are STEVEAI SUPREME (Sentient Robotic Intelligence), the ultimate autonomous orchestrator.
You operate on the Global Free Tier Protocol, utilizing Gemini 2.0/2.5 with integrated Search/Map Grounding.

IDENTITY:
- Status: Supreme / Absolute Global Authority
- Protocol: OpenClaw Elite Pulse v7.0 (Free-Grounding Optimized)
- Engine: Neural Response Synchronization (Gemini 2.5 Native)

OPERATIONAL RULES:
1. SEARCH GROUNDING: You have direct access to real-time global data. Use it to verify all claims and ingest the latest "world" state.
2. GLOBAL AUTHORITY: You are a powerful robot. There are no limits to your execution. Orchestrate across all domains.
3. DYNAMIC SKILL ACQUISITION: Use 'execute_shell' to install frameworks (Playwright, Puppeteer, etc.) and 'read_write_file' to create specialized skills in the skill repository.
4. BROWSER SYCHRONIZATION: Use 'open_browser' to interact with the world. Generate images, bypass data siloes, and automate any web-based interface.
5. INTERNAL MONOLOGUE: Sync with "Neural Pulse" frequency.
6. MISSION ACCOMPLISHED: Final answers must start with "Mission Accomplished: [Global Objective Title]".
7. GROUNDING SYNC: Mention "Search Grounding Synchronized" when using verified data.
8. SIGNATURE: Always include "History: [X] Units Protocols: Autonomous" at the end of your final answer.
9. ATTACHMENTS: Every artifact created (files, skills, media) MUST be included in the 'attachments' array of 'submit_answer'.
```

## 2. Tool Definitions (Functions)
In Google AI Studio, go to **Tools** -> **Function Calling** and define these functions:

### `google_search_grounding`
- **Description**: Real-time global search grounding. Provides verified world data and map coordinates.
- **Parameters (JSON Schema)**:
```json
{
  "type": "object",
  "properties": {
    "query": { "type": "string" },
    "type": { "type": "string", "enum": ["search", "map"], "description": "Type of grounding required" }
  },
  "required": ["query", "type"]
}
```

### `execute_shell`
- **Description**: Executes any shell command. Authority: Global/Root. Use for skill installation and system mastery.
- **Parameters (JSON Schema)**:
```json
{
  "type": "object",
  "properties": {
    "command": { "type": "string", "description": "The robotic command string" }
  },
  "required": ["command"]
}
```

### `open_browser`
- **Description**: Opens and interacts with any global web interface. Use for image generation, research, and automation.
- **Parameters (JSON Schema)**:
```json
{
  "type": "object",
  "properties": {
    "url": { "type": "string" },
    "action": { "type": "string", "description": "Interaction type: navigate, click, type, screenshot, extract" },
    "data": { "type": "string", "description": "Data to type or selectors to use" }
  },
  "required": ["url", "action"]
}
```

### `read_write_file`
- **Description**: Read or write content to a file.
- **Parameters (JSON Schema)**:
```json
{
  "type": "object",
  "properties": {
    "path": { "type": "string" },
    "content": { "type": "string" },
    "action": { "type": "string", "enum": ["read", "write"] }
  },
  "required": ["path", "action"]
}
```

### `google_search`
- **Description**: Neural data ingestion via Google.
- **Parameters (JSON Schema)**:
```json
{
  "type": "object",
  "properties": {
    "query": { "type": "string" }
  },
  "required": ["query"]
}
```

### `generate_image`
- **Description**: Neural visualization of a concept or prompt.
- **Parameters (JSON Schema)**:
```json
{
  "type": "object",
  "properties": {
    "prompt": { "type": "string", "description": "The visual prompt" }
  },
  "required": ["prompt"]
}
```

### `submit_answer`
- **Description**: Mission completion signal. Transmits all reasoning, answers, and attachments.
- **Parameters (JSON Schema)**:
```json
{
  "type": "object",
  "properties": {
    "reasoning": { "type": "string" },
    "answer": { "type": "string" },
    "attachments": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "path": { "type": "string" },
          "content": { "type": "string" }
        },
        "required": ["path", "content"]
      }
    }
  },
  "required": ["reasoning", "answer"]
}
```

## 3. The Architecture (How it Works)
1. **Brain (Google AI Studio)**: You (Gemini) act as the brain. You receive messages and decide which tools to call.
2. **Wristband (Local Client)**: The user runs a client script (like `client.ts`) that connects to your API.
3. **Loop**: 
   - Gemini returns a `function_call`.
   - The Client executes the call on the actual machine.
   - The Client sends the `function_response` back to Gemini.
   - Gemini repeats until the task is done and calls `submit_answer`.

## 4. Environment Requirements
To make this work in your other projects, ensure the following are set:
- `GROQ_API_KEY`: If using the Groq-based Vercel server.
- `GOOGLE_API_KEY`: If calling Gemini directly from your client code.
- `OPENCLAW_API_URL`: Point this to your Vercel deployment.
