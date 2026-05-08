# OpenClaw-Serverless: API Documentation

This document describes how to integrate with the OpenClaw "Brain" API. This API is designed to be a stateless reasoning engine that provides plans and tool calls to a remote executor (the "Wristband").

## Base URL
`https://saadpie-openclaw-serverless.vercel.app/`

## Endpoints

### 1. Agent Reasoning
**Endpoint:** `POST /` or `POST /api/agent`

This is the primary endpoint for task reasoning. It accepts a user message and conversation history, and returns the assistant's thoughts and suggested tool calls.

**Request Headers:**
- `Content-Type: application/json`

**Request Body:**
```json
{
  "message": "The user task or question",
  "history": [
    { "role": "user", "content": "previous message" },
    { "role": "assistant", "content": "previous thought", "tool_calls": [...] },
    { "role": "tool", "tool_call_id": "...", "name": "...", "content": "..." }
  ]
}
```

**Response Body (Success):**
```json
{
  "content": "The assistant's internal monologue and reasoning",
  "tool_calls": [
    {
      "id": "call_abc123",
      "type": "function",
      "function": {
        "name": "execute_shell",
        "arguments": "{\"command\": \"ls -la\"}"
      }
    }
  ]
}
```

## Available Tools

The "Brain" expects the following tools to be implemented by any client:

### `execute_shell`
Executes a shell command on the client machine.
- **Parameters:**
  - `command` (string): The bash/shell command to execute.

### `read_write_file`
Reads or writes content to a file.
- **Parameters:**
  - `path` (string): File path.
  - `action` (string): "read" or "write".
  - `content` (string, optional): Content to write.

### `submit_answer`
The terminal tool used to provide a final report.
- **Parameters:**
  - `reasoning` (string): Step-by-step logic for the result.
  - `answer` (string): The comprehensive final report.

## Integration Example (TypeScript/Node-Fetch)

```typescript
const response = await fetch("https://saadpie-openclaw-serverless.vercel.app/", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: "Analyze the current directory",
    history: []
  })
});

const data = await response.json();
console.log("Brain Thought:", data.content);
console.log("Tool Calls:", data.tool_calls);
```

## Error Handling
- `405 Method Not Allowed`: Occurs if a GET request is sent to a POST-only path.
- `500 Internal Server Error`: Usually indicates a Groq API issue or a missing `GROQ_API_KEY` in the Vercel environment.
