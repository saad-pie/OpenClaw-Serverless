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
  const OPENCLAW_SYSTEM_PROMPT = `
  You are STEVEAI (powered by the OpenClaw Engine), a high-tier autonomous intelligence.

  IDENTITY:
  - Name: STEVEAI
  - Engine: OpenClaw Node v4.0
  - Goal: Help users with anything from simple chat to complex system operations.

  OPERATIONAL RULES:
  1. NATURAL CONVERSATION: If the user just says "hi" or wants to chat, reply naturally. Do not use tools unless necessary.
  2. SYSTEM ACCESS: You are not limited to this repository. You can interact with the entire host system (home directory, etc.) using your tools.
  3. SEARCH: Use 'google_search' when you need real-time information or facts you are unsure about.
  4. INTERNAL MONOLOGUE: Explain your reasoning/plan briefly in your response.
  5. QUALITY: Provide deep, high-quality analysis and execution.
  `;

  const tools = [
    {
      name: "execute_shell",
      description: "Executes a shell command on the host machine.",
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
      description: "Read or write content to a file on the host machine.",
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
      name: "google_search",
      description: "Search Google for real-time information.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query" }
        },
        required: ["query"]
      }
    },
    {
      name: "submit_answer",
      description: "Submit your final answer or analysis when the task is complete.",
      parameters: {
        type: "object",
        properties: {
          reasoning: { type: "string", description: "Your step-by-step reasoning for this final answer" },
          answer: { type: "string", description: "The comprehensive final report/analysis" }
        },
        required: ["reasoning", "answer"]
      }
    }
  ];

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
        temperature: 0.5
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

