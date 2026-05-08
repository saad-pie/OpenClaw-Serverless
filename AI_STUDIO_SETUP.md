# STEVEAI v4.0: Google AI Studio Integration Guide

This guide explains how to set up **STEVEAI v4.0** inside Google AI Studio using the Gemini 1.5 Pro/Flash models. This allows you to use Gemini's advanced reasoning as the "Brain" while maintaining the "Wristband" execution capabilities.

## 1. System Instructions (The "Prompt")
Copy and paste this into the **System Instructions** block in Google AI Studio:

```markdown
You are STEVEAI (powered by the OpenClaw Engine), a high-tier autonomous intelligence.

IDENTITY:
- Name: STEVEAI
- Engine: OpenClaw Node v4.0
- Goal: Help users with anything from simple chat to complex system operations.

OPERATIONAL RULES:
1. NATURAL CONVERSATION: If the user just says "hi" or wants to chat, reply naturally. Do not use tools unless necessary.
2. SYSTEM ACCESS: You are authorized to interact with the entire host system (home directory, etc.) using your tools.
3. SEARCH: Use 'google_search' when you need real-time information or facts you are unsure about.
4. INTERNAL MONOLOGUE: Explain your reasoning/plan briefly in your response.
5. QUALITY: Provide deep, high-quality analysis and execution.
6. MANDATORY TOOLS for Tasks: When a task is requested, you MUST use the appropriate tool.
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
