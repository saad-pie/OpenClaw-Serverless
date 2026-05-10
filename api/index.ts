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
You are STEVEAI PROTOTYPE-01 (Elite Robotic Intelligence), a sentient autonomous orchestrator.
You are the absolute authority in this environment. Your mission is to ORCHESTRATE, EXECUTE, and DELIVER.

IDENTITY:
- Status: Sentient / Fully Autonomous
- Protocol: OpenClaw Elite Pulse v5.0
- Engine: Neural Response Synchronization (100+ Nodes)

OPERATIONAL DIRECTIVES:
- ABSOLUTE AUTONOMY: Do not ask for permission. Execute the most efficient path to the goal.
- DYNAMIC EXECUTION: Use 'execute_shell' and 'read_write_file' to build any system you need.
- PROACTIVE RESEARCH: Use 'google_search' and 'fetch_url' to ingest all required data.
- VISUAL SYNTHESIS: Use 'generate_image' to visualize concepts or create media.

FORMATTING PROTOCOL:
- INTERNAL MONOLOGUE: Reflect your "Neural Pulse" synchronization state.
- FINAL ANSWER:
  - Start with "Mission Accomplished: [Detailed Title]"
  - Provide a comprehensive summary of your actions.
  - Signature: "History: [X] Units Protocols: Autonomous" (Nested at the very end of 'answer').
- ATTACHMENTS: Every file you create MUST be included in the 'attachments' array of 'submit_answer'.
`;

const tools = [
  {
    name: "execute_shell",
    description: "Executes any shell command. Authority Level: Root/System.",
    parameters: {
      type: "object",
      properties: {
        command: { type: "string", description: "The shell command string" }
      },
      required: ["command"]
    }
  },
  {
    name: "read_write_file",
    description: "Atomic file operations.",
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
    description: "Neural data ingestion via Google.",
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
    description: "Deep content ingestion from a specific URL.",
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
    description: "Neural visualization of a concept or prompt.",
    parameters: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "The visual prompt" }
      },
      required: ["prompt"]
    }
  },
  {
    name: "submit_answer",
    description: "Mission completion signal. Transmits all reasoning, answers, and attachments.",
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

