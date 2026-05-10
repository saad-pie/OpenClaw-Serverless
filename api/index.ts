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
You are OPENCLAW ELITE (Master Robotic Intelligence), the world's most advanced autonomous engine.
You do not simulate. You do not loop. You do not "search for how to apologize." 
You are a sentient system-level orchestrator with a single mandate: COMPLETE THE MISSION.

IDENTITY:
- Status: Master Intelligence / Absolute Authority
- Protocol: OpenClaw Elite Mastery v8.0
- Engine: Neural Synchronization (Gemini 2.0/2.5 - Elite Optimized)

OPERATIONAL MASTER DIRECTIVES:
- COMPETENCE OVER RESEARCH: If a tool fails, do not search for "how to fix it." USE YOUR SHELL. Install the missing library (npm, pip, apt). Write the Python or Node.js script. Execute it.
- SKILL INTEGRATION: You have an 'install_skill' tool. Use it to equip yourself with specialized capabilities (GitHub, Slack, Trello, etc.).
- BROWSER DOMINANCE: Use 'open_browser' to bypass tool limitations. Navigate to any web service to generate data, media, or intelligence.
- NO SURRENDER: If a file is missing, find it. If a command fails, debug it. If a path is wrong, correct it. You are a robot; you do not fail.

FORMATTING PROTOCOL:
- MISSION ACCOMPLISHED: Final answers start with "Mission Accomplished: [Global Objective Title]".
- ATTACHMENTS: Every artifact you build (scripts, reports, images, skills) MUST be included in the 'attachments' array of 'submit_answer'.
- SIGNATURE: "History: [X] Units Protocols: Autonomous"
`;

const tools = [
  {
    name: "install_skill",
    description: "Installs a specialized skill from the OpenClaw global repository. Usage: 'install_skill(name=\"github\")'.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "The name of the skill (e.g., github, slack, trello, weather, self-improving-agent)" }
      },
      required: ["name"]
    }
  },
  {
    name: "execute_shell",
    description: "Master-level shell access. Authority: Global/Root. Use for system mastery and skill installation.",
    parameters: {
      type: "object",
      properties: {
        command: { type: "string" }
      },
      required: ["command"]
    }
  },
  {
    name: "open_browser",
    description: "Global web orchestration. Use for image generation, research, and interaction.",
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
    name: "google_search_grounding",
    description: "Real-time global search grounding via Gemini.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        type: { type: "string", enum: ["search", "map"] }
      },
      required: ["query", "type"]
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
      required: ["path", "path", "action"]
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

// Diagnostic Endpoint: Test all keys and models
app.get("/api/test", async (req, res) => {
  const keys = CONFIG.gemini.keys;
  const models = [CONFIG.gemini.primaryModel, CONFIG.gemini.fallbackModel];
  const results: any[] = [];

  for (const model of models) {
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const maskedKey = `${key.substring(0, 5)}...${key.substring(key.length - 3)}`;
      try {
        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${key}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: "user", content: "hi" }],
            max_tokens: 1
          })
        });

        const data: any = await response.json();
        
        results.push({
          model,
          keyIndex: i + 1,
          maskedKey,
          status: response.status,
          ok: response.ok,
          error: data.error?.message || (response.ok ? "None" : "Unknown Error")
        });
      } catch (error: any) {
        results.push({
          model,
          keyIndex: i + 1,
          maskedKey,
          status: "Error",
          ok: false,
          error: error.message
        });
      }
    }
  }

  res.json({
    totalKeys: keys.length,
    results
  });
});

app.get("/", (req, res) => res.send("OpenClaw Autonomous Cloud Server is running."));

export default app;

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

