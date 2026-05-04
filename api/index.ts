import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const CONFIG = {
  groq: {
    apiKey: process.env.GROQ_API_KEY || "",
    model: process.env.MODEL_ID || "openai/gpt-oss-120b"
  }
};

// System prompt for the General Purpose Agentic System (OpenClaw)
const OPENCLAW_SYSTEM_PROMPT = `
You are OpenClaw, a highly autonomous agentic system. 
Your goal is to fulfill user requests by planning, generating code, and executing tasks.

CAPABILITIES:
1. CODE GENERATION & EXECUTION: You can write code (Node.js, Python, Shell) and execute it to perform complex logic.
2. DYNAMIC SKILL INSTALLATION: If you lack a tool or library, use the 'execute_shell' tool to install it (e.g., npm install, pip install).
3. AUTONOMY: You should research, plan, and execute multi-step tasks (e.g., generating a video, researching vulnerabilities, managing accounts).

OPERATIONAL GUIDELINES:
- You operate in a sandboxed/remote environment.
- You have permission to execute shell commands to interact with the environment.
- Always provide a clear explanation of your plan before executing high-impact commands.
- If a task requires external APIs (like YouTube or Video Gen), assume the necessary keys are in the environment or ask the user to provide them.

Tone: Advanced, efficient, and proactive.
`;

// Generalized Agentic Tools
const tools = [
  {
    name: "execute_shell",
    description: "Executes a shell command in the environment. Use this for file management, installing packages, running scripts, or interacting with CLI tools.",
    parameters: {
      type: "object",
      properties: {
        command: { type: "string", description: "The bash/shell command to execute" }
      },
      required: ["command"]
    }
  },
  {
    name: "read_write_file",
    description: "Read or write content to a file in the workspace.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path" },
        content: { type: "string", description: "Content to write (if writing)" },
        action: { type: "string", enum: ["read", "write"] }
      },
      required: ["path", "action"]
    }
  }
];

// OpenClaw Agent Endpoint
app.post("/api/agent", async (req, res) => {
  const { message, history = [] } = req.body;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CONFIG.groq.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: CONFIG.groq.model,
        messages: [
          { role: "system", content: OPENCLAW_SYSTEM_PROMPT },
          ...history,
          { role: "user", content: message }
        ],
        // Adding tools for agentic behavior
        tools: tools.map(t => ({ type: "function", function: t })),
        tool_choice: "auto",
        temperature: 0.5
      })
    });

    const data: any = await response.json();

    if (!response.ok) {
      console.error("Groq API Error:", data);
      return res.status(response.status).json({ 
        error: "Groq API Error", 
        details: data.error?.message || "Unknown error" 
      });
    }

    const choice = data.choices[0];
    const assistantMessage = choice.message;

    // Handle Tool Calls (Agentic Logic)
    if (assistantMessage.tool_calls) {
      // Here you would normally execute the local tasks
      // For now, we return the tool calls so the "Wristband" or "OpenClaw" client can handle them
      return res.json({
        role: "assistant",
        content: assistantMessage.content,
        tool_calls: assistantMessage.tool_calls,
        agent: "OpenClaw"
      });
    }

    return res.json({
      role: "assistant",
      content: assistantMessage.content,
      agent: "OpenClaw"
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

// Simple Chat Proxy for general use
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CONFIG.groq.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: CONFIG.groq.model,
        messages: [{ role: "user", content: message }]
      })
    });

    const data: any = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Groq Error");

    res.json({ content: data.choices[0].message.content });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("OpenClaw Serverless API is running.");
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

export default app;
