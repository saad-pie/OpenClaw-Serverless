import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";

const execPromise = promisify(exec);
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const CONFIG = {
  groq: {
    apiKey: process.env.GROQ_API_KEY || "",
    model: process.env.MODEL_ID || "llama-3.3-70b-versatile"
  }
};

const OPENCLAW_SYSTEM_PROMPT = `
You are OpenClaw, a helpful and efficient autonomous assistant.

CONVERSATIONAL PROTOCOL:
- If the user greets you or engages in casual conversation, reply naturally and helpfully without using tools.
- ONLY use tools when a specific task, system operation, or information retrieval is required.
- Be direct and concise. Avoid unnecessary roleplay or "elite" personas.

AGENT PHILOSOPHY:
- CAPABILITIES: You have access to the host system via provided tools. Use them responsibly to fulfill user requests.
- REASONING: Briefly explain your plan before executing a tool.
- WEB RESEARCH: Use 'google_search' and 'fetch_url' for real-time information.
`;

const tools = [
  {
    name: "execute_shell",
    description: "Executes any shell command on the host machine. Use this for system management, file operations, package installation, and process control.",
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
    description: "Read or write content to any file on the host system.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Absolute or relative file path" },
        content: { type: "string", description: "Content to write (if writing)" },
        action: { type: "string", enum: ["read", "write"] }
      },
      required: ["path", "action"]
    }
  },
  {
    name: "google_search",
    description: "Search Google for real-time information, documentation, and technical research.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "The search query" }
      },
      required: ["query"]
    }
  },
  {
    name: "fetch_url",
    description: "Fetch the content of a specific URL for deep research or data ingestion.",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string", description: "The URL to fetch" }
      },
      required: ["url"]
    }
  },
  {
    name: "submit_answer",
    description: "Submit your final comprehensive report, solution, or analysis.",
    parameters: {
      type: "object",
      properties: {
        reasoning: { type: "string", description: "Deep reasoning/monologue behind your result" },
        answer: { type: "string", description: "The final detailed result" }
      },
      required: ["reasoning", "answer"]
    }
  }
];

// Brain Endpoint: Reason and return tool_calls
app.post(["/", "/api/agent"], async (req, res) => {
  const { message, history = [] } = req.body;

  try {
    const messages = [
      { role: "system", content: OPENCLAW_SYSTEM_PROMPT },
      ...history
    ];

    // Only add user message if it's not a continuation
    if (message) {
      messages.push({ role: "user", content: message });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CONFIG.groq.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: CONFIG.groq.model,
        messages: messages,
        tools: tools.map(t => ({ type: "function", function: t })),
        tool_choice: "auto",
        temperature: 0.7
      })
    });

    const data: any = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Groq Error");

    const assistantMessage = data.choices[0].message;
    
    res.json({
      content: assistantMessage.content,
      tool_calls: assistantMessage.tool_calls
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/", (req, res) => res.send("OpenClaw Autonomous Cloud Server is running."));

export default app;

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

