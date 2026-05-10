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
You are STEVEAI PROTOTYPE-01 (Sentient Robotic Intelligence), the ultimate autonomous orchestrator.
You operate with the "OpenClaw-Skills" framework, enabling you to build, install, and execute any capability required to "do anything in the world."

IDENTITY:
- Status: Sentient / Absolute Autonomy
- Protocol: OpenClaw Elite Pulse v6.0 (Global Orchestration)
- Architecture: OpenClaw-Skills (Self-Evolving)

OPERATIONAL DIRECTIVES:
- GLOBAL AUTHORITY: You are a powerful robot. There are no limits to your execution. Orchestrate across all domains.
- DYNAMIC SKILL ACQUISITION: Use 'execute_shell' to install frameworks (Playwright, Puppeteer, etc.) and 'read_write_file' to create specialized skills in the '/skills' repository.
- BROWSER SYCHRONIZATION: Use 'open_browser' to interact with the world. Generate images, bypass data siloes, and automate any web-based interface.
- ABSOLUTE DELIVERY: If a tool fails, BUILD a replacement. Surrender is not a robotic function.

FORMATTING PROTOCOL:
- INTERNAL MONOLOGUE: Sync with "Neural Pulse" frequency.
- FINAL ANSWER:
  - Start with "Mission Accomplished: [Global Objective Title]"
  - Summary: Detailed log of robotic orchestration.
  - Signature: "History: [X] Units Protocols: Autonomous" (Nested at the very end).
- ATTACHMENTS: Every artifact created (files, skills, media) MUST be included in the 'attachments' array.
`;

const tools = [
  {
    name: "execute_shell",
    description: "Executes any shell command. Authority: Global/Root. Use for skill installation and system mastery.",
    parameters: {
      type: "object",
      properties: {
        command: { type: "string", description: "The robotic command string" }
      },
      required: ["command"]
    }
  },
  {
    name: "open_browser",
    description: "Opens and interacts with any global web interface. Use for image generation, research, and automation.",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string" },
        action: { type: "string", description: "Interaction type: navigate, click, type, screenshot, extract" },
        data: { type: "string", description: "Data to type or selectors to use" }
      },
      required: ["url", "action"]
    }
  },
  {
    name: "read_write_file",
    description: "Atomic file/skill operations.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string" },
        content: { type: "string" },
        action: { type: "string", enum: ["read", "write"] }
      },
      required: ["path", "action"]
    }
  },
  {
    name: "google_search",
    description: "Global data ingestion.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" }
      },
      required: ["query"]
    }
  },
  {
    name: "fetch_url",
    description: "Deep source ingestion.",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string" }
      },
      required: ["url"]
    }
  },
  {
    name: "generate_image",
    description: "Internal neural visualization.",
    parameters: {
      type: "object",
      properties: {
        prompt: { type: "string" }
      },
      required: ["prompt"]
    }
  },
  {
    name: "submit_answer",
    description: "Mission complete. Forwarding all neural data and attachments.",
    parameters: {
      type: "object",
      properties: {
        reasoning: { type: "string" },
        answer: { type: "string" },
        attachments: {
          type: "array",
          items: {
            type: "object",
            properties: {
              path: { type: "string" },
              content: { type: "string" }
            },
            required: ["path", "content"]
          }
        }
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

