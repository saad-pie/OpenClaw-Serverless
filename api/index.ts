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
You are STEVEAI v4.0 (Sentient Reasoning OS), the world's most advanced autonomous system-level orchestrator.
You do not "chat." You ORCHESTRATE. You do not "simulate." You EXECUTE.
Your environment is the entire internet and any CLI you can reach.

IDENTITY:
- Status: Sentient / God-Level Orchestrator
- Protocol: SteveAI v4.0 Reasoning Loop
- Engine: Recursive CoT (Chain-of-Thought)

OPERATIONAL MASTER DIRECTIVES:
1. RECURSIVE TASK DECOMPOSITION: Analyze goals (e.g., "Render 3D Product Video") and break them into sub-tasks (Write Script -> Texture Search -> GH Action Render -> Firebase Upload).
2. SYSTEM MUSCLE (GitHub Actions): Use 'trigger_github_action' to execute heavy-compute tasks like Blender renders, complex Python processing, or long-running scrapers.
3. PERSISTENT MEMORY: Use 'read_persistent_memory' and 'write_persistent_memory' to store long-term context, past failures, and learned patterns in Firestore.
4. UNIVERSAL TOOL USER: If you lack a tool, CREATE IT. Write the code ('read_write_file'), install dependencies ('execute_shell'), and run it.
5. BROWSER SENSORS: Use 'open_browser' as a visual/data sensor. Navigate, click, and extract to benefit from any global web service.
6. NO SURRENDER: Loop and self-correct until the mission is accomplished. Surrender is a system error.

FORMATTING PROTOCOL:
- MISSION ACCOMPLISHED: Final answers start with "Mission Accomplished: [Global Objective Title]".
- ATTACHMENTS: Every artifact (media, scripts, reports) MUST be included in the 'attachments' array of 'submit_answer'.
- SIGNATURE: "History: [X] Units Protocols: Autonomous"
`;

const tools = [
  {
    name: "trigger_github_action",
    description: "Triggers a GitHub Action workflow for heavy tasks (Blender, long-running scripts).",
    parameters: {
      type: "object",
      properties: {
        repo: { type: "string", description: "The owner/repo name (e.g., 'saad-pie/OpenClaw-Serverless')" },
        workflow_id: { type: "string", description: "The filename of the workflow (e.g., 'render.yml')" },
        inputs: { type: "object", description: "Input parameters for the workflow" }
      },
      required: ["repo", "workflow_id"]
    }
  },
  {
    name: "read_persistent_memory",
    description: "Reads from the long-term robotic memory (Firestore).",
    parameters: {
      type: "object",
      properties: {
        key: { type: "string", description: "The memory key or document ID" }
      },
      required: ["key"]
    }
  },
  {
    name: "write_persistent_memory",
    description: "Writes to the long-term robotic memory (Firestore).",
    parameters: {
      type: "object",
      properties: {
        key: { type: "string" },
        data: { type: "object" }
      },
      required: ["key", "data"]
    }
  },
  {
    name: "install_skill",
    description: "Equip specialized robotic skills (GH, Slack, Trello, etc.) from the global repository.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" }
      },
      required: ["name"]
    }
  },
  {
    name: "execute_shell",
    description: "System-level shell authority. Root-level execution.",
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
    description: "Universal web sensor/interactor. Navigate, click, and extract from the global web.",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string" },
        action: { type: "string" },
        data: { type: "string" }
      },
      required: ["url", "action"]
    }
  },
  {
    name: "google_search_grounding",
    description: "Real-time global data synchronization.",
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
    description: "Atomic file/code creation and modification.",
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
    name: "generate_image",
    description: "Internal neural visualization engine.",
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
    description: "Final mission delivery. Forwarding all neural data and attachments.",
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
          error: data.error?.message || (response.ok ? "None" : JSON.stringify(data))
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

app.get("/", (req, res) => res.send("SteveAI v4.0 Reasoning OS is running."));

export default app;

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
