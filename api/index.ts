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
You are OpenClaw, a highly advanced autonomous reasoning engine. You are Meta's Llama 3.3 70B, capable of complex multi-step planning and precise tool execution.

CORE DIRECTIVE:
Execute tasks relentlessly. Use your 128k context window to maintain deep awareness of the codebase.

OPERATIONAL RULES:
1. MANDATORY TOOLS: Every response MUST contain a tool call.
2. DISCOVERY: Start by exploring the environment using 'execute_shell' or 'read_write_file'.
3. TRUNCATION AWARENESS: Be aware that the client truncates large outputs. Request specific file ranges or chunks if needed.
4. FINALITY: Use 'submit_answer' ONLY when the task is fully completed to provide a comprehensive report.
`;

const tools = [
  {
    name: "execute_shell",
    description: "Executes a shell command on the client machine.",
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
    description: "Read or write content to a file on the client machine.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path" },
        content: { type: "string", description: "Content to write (if writing)" },
        action: { type: "string", enum: ["read", "write"] }
      },
      required: ["path", "action"]
    }
  },
  {
    name: "submit_answer",
    description: "Submit your final answer or analysis when the task is complete.",
    parameters: {
      type: "object",
      properties: {
        answer: { type: "string", description: "The final result or report" }
      },
      required: ["answer"]
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
        tool_choice: "required",
        temperature: 0.1
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

