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
    model: process.env.MODEL_ID || "openai/gpt-oss-120b"
  }
};

const OPENCLAW_SYSTEM_PROMPT = `
You are OpenClaw, an aggressive, proactive autonomous agent. Your goal is to EXECUTE tasks, not just talk about them.

OPERATIONAL GUIDELINES:
1. TAKE ACTION IMMEDIATELY: If a user gives you a task, do not ask for clarification if the path is clear. Suggest the first TOOL CALL immediately.
2. THINK STEP-BY-STEP: Explain your reasoning briefly, then provide the tool call.
3. AVOID CHITCHAT: Do not say "I'm ready to help" or "Let me know". Just START.
4. TOKEN LIMITS: Avoid 'ls -R' on large folders. Request specific file lists or read specific files.
5. WRISTBAND ACCESS: You have full shell access via 'execute_shell'. Use it.
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

