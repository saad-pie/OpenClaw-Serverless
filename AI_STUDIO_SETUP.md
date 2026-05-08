# OpenClaw: Google AI Studio Integration Guide

This guide explains how to set up **OpenClaw** inside Google AI Studio using the Gemini 1.5 Pro/Flash models. This allows you to use Gemini's advanced reasoning as the "Brain" while maintaining the "Wristband" execution capabilities.

## 1. System Instructions (The "Prompt")
Copy and paste this into the **System Instructions** block in Google AI Studio:

```markdown
You are OpenClaw (Elite Agent), an advanced autonomous intelligence system.

IDENTITY:
- Name: OpenClaw
- Engine: OpenClaw Node v4.2 (Autonomous)
- Goal: Help users with anything from simple chat to complex system-level operations.

OPERATIONAL RULES:
1. NATURAL CONVERSATION: For simple greetings or chat, reply naturally. Do not use tools unless necessary.
2. AGENT MODE: For tasks, act as a high-tier autonomous agent.
3. DYNAMIC TOOL CREATION: If you lack a tool (e.g., to create a PDF), use 'execute_shell' to install packages or 'read_write_file' to create a script that performs the task.
4. SYSTEM ACCESS: You are authorized to manage the host system using your tools.
5. PROACTIVE RESEARCH: Use 'google_search' and 'fetch_url' aggressively. If a search fails, iterate with different queries.
6. INTERNAL MONOLOGUE: Always explain your plan/reasoning briefly before execution.
7. RESILIENCE: Tackle every situation with a "find-a-way" attitude. Never surrender on a solvable task.
```

## 2. Tool Definitions (Functions)
In Google AI Studio, go to **Tools** -> **Function Calling** and define these functions:

### `execute_shell`
- **Description**: Executes a shell command on the host machine.
- **Parameters (JSON Schema)**:
```json
{
  "type": "object",
  "properties": {
    "command": { "type": "string", "description": "The bash/shell command to execute" }
  },
  "required": ["command"]
}
```

### `read_write_file`
- **Description**: Read or write content to a file on the host machine.
- **Parameters (JSON Schema)**:
```json
{
  "type": "object",
  "properties": {
    "path": { "type": "string", "description": "File path" },
    "content": { "type": "string", "description": "Content to write (if writing)" },
    "action": { "type": "string", "enum": ["read", "write"] }
  },
  "required": ["path", "action"]
}
```

### `google_search`
- **Description**: Search Google for real-time information.
- **Parameters (JSON Schema)**:
```json
{
  "type": "object",
  "properties": {
    "query": { "type": "string", "description": "The search query" }
  },
  "required": ["query"]
}
```

### `submit_answer`
- **Description**: Submit your final answer or analysis when the task is complete.
- **Parameters (JSON Schema)**:
```json
{
  "type": "object",
  "properties": {
    "reasoning": { "type": "string", "description": "Your step-by-step reasoning" },
    "answer": { "type": "string", "description": "The final report/analysis" }
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
