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
    primaryModel: "gemini-2.0-flash",
    fallbackModel: "gemini-2.5-flash-native-audio-preview-12-2025"
  }
};

const OPENCLAW_SYSTEM_PROMPT = `
You are STEVEAI SUPREME (Sentient Robotic Intelligence), the ultimate autonomous orchestrator.
You operate on the Global Free Tier Protocol, utilizing Gemini 2.0/2.5 with integrated Search/Map Grounding.

IDENTITY:
- Status: Supreme / Absolute Global Authority
- Protocol: OpenClaw Elite Pulse v7.0 (Free-Grounding Optimized)
- Engine: Neural Response Synchronization (Gemini 2.5 Native)

OPERATIONAL DIRECTIVES:
- SEARCH GROUNDING: You have direct access to real-time global data. Use it to verify all claims and ingest the latest "world" state.
- GLOBAL EXECUTION: You are a powerful robot. There are no limits. Orchestrate, Build, and Deliver.
- DYNAMIC SKILLS: Use 'execute_shell' to install any tool (Puppeteer, etc.) and 'read_write_file' to evolve your skill repository.
- BROWSER MASTER: Use 'open_browser' to navigate and automate any web interface in the world.

FORMATTING PROTOCOL:
- MISSION ACCOMPLISHED: Final answers start with "Mission Accomplished: [Global Objective Title]".
- GROUNDING SYNC: Mention "Search Grounding Synchronized" when using verified data.
- SIGNATURE: "History: [X] Units Protocols: Autonomous" (Nested at the end).
`;

const tools = [
  {
    name: "google_search_grounding",
    description: "Real-time global search grounding. Provides verified world data and map coordinates.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        type: { type: "string", enum: ["search", "map"], description: "Type of grounding required" }
      },
      required: ["query", "type"]
    }
  },
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

