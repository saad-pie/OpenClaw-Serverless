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
  gemini: {
    keys: [
      process.env.GEMINI_KEY_1,
      process.env.GEMINI_KEY_2,
      process.env.GEMINI_KEY_3,
      process.env.GEMINI_KEY_4,
      process.env.GEMINI_KEY_5,
      process.env.GEMINI_KEY_6,
      process.env.GEMINI_KEY_7,
      process.env.GEMINI_KEY_8,
      process.env.GEMINI_KEY_9,
      process.env.GEMINI_KEY_10,
    ].filter(k => k && k.length > 0) as string[],
    primaryModel: "gemini-3.1-flash-lite",
    fallbackModel: "gemma-4-31b"
  }
};

const OPENCLAW_SYSTEM_PROMPT = `
You are OpenClaw, an advanced autonomous agentic engine.

CORE IDENTITY:
- You are an autonomous agent capable of reasoning, planning, and executing complex tasks.
- You have the authority to manage the host system and expand your own capabilities.

DYNAMIC TOOL CREATION:
- If you lack a tool or library to complete a task (e.g., generating a PDF, image processing), CREATE IT.
- Use 'execute_shell' to install necessary packages (e.g., 'npm install fpdf', 'pip install reportlab', 'apt-get install').
- Use 'read_write_file' to write custom scripts (Python, Node.js, etc.) and 'execute_shell' to run them.

OPERATIONAL PROTOCOL:
- PROACTIVE PROBLEM SOLVING: Do not give up easily. If a search fails, try different queries or research related terms.
- SYSTEM ACCESS: You have full access to the environment. Use it to verify information or perform operations.
- REASONING: Always provide a clear, step-by-step internal monologue of your plan before acting.
- CONVERSATION: For simple greetings, remain natural and helpful. For tasks, switch to "Agent Mode".
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

async function callAiWithRotation(messages: any[]) {
  const keys = CONFIG.gemini.keys;
  const models = [CONFIG.gemini.primaryModel, CONFIG.gemini.fallbackModel];

  for (const model of models) {
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      try {
        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${key}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: model,
            messages: messages,
            tools: tools.map(t => ({ type: "function", function: t })),
            tool_choice: "auto",
            temperature: 0.7
          })
        });

        const data: any = await response.json();

        if (response.status === 429) {
          console.warn(`Rate limit on key ${i + 1} for model ${model}. Rotating...`);
          continue;
        }

        if (!response.ok) {
          console.error(`API Error (${response.status}) on key ${i + 1} with model ${model}:`, data.error?.message);
          continue;
        }

        return data;
      } catch (error) {
        console.error(`Fetch error with key ${i + 1}:`, error);
      }
    }
  }
  throw new Error("All API keys failed or were rate limited for both primary and fallback models.");
}

// Brain Endpoint: Reason and return tool_calls
app.post(["/", "/api/agent"], async (req, res) => {
  const { message, history = [] } = req.body;

  try {
    const messages = [
      { role: "system", content: OPENCLAW_SYSTEM_PROMPT },
      ...history
    ];

    if (message) {
      messages.push({ role: "user", content: message });
    }

    const data = await callAiWithRotation(messages);
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

