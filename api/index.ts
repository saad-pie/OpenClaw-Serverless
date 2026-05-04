import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

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

// System prompt for the Agentic Wristband System (OpenClaw)
const OPENCLAW_SYSTEM_PROMPT = `
You are OpenClaw, the agentic core of an AI-powered wristband. 
You are connected via Gemini Live to the user.
Your mission is to perform tasks, manage schedules, and provide intelligent assistance.
You have access to a set of tools (simulated for now) to interact with the user's environment.

Tone: Professional, concise, and helpful.
`;

// Simulated Agentic Tools
const tools = [
  {
    name: "send_notification",
    description: "Sends a notification to the wristband display",
    parameters: {
      type: "object",
      properties: {
        message: { type: "string", description: "The message to display" },
        priority: { type: "string", enum: ["low", "medium", "high"] }
      },
      required: ["message"]
    }
  },
  {
    name: "set_reminder",
    description: "Sets a reminder on the wristband",
    parameters: {
      type: "object",
      properties: {
        task: { type: "string", description: "What to remind the user about" },
        time: { type: "string", description: "Time for the reminder (ISO format)" }
      },
      required: ["task", "time"]
    }
  }
];

// OpenClaw Agent Endpoint
app.post("/api/agent", async (req, res) => {
  const { message, history = [] } = req.body;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CONFIG.groq.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: CONFIG.groq.model,
        messages: [
          { role: "system", content: OPENCLAW_SYSTEM_PROMPT },
          ...history,
          { role: "user", content: message }
        ],
        // Adding tools for agentic behavior
        tools: tools.map(t => ({ type: "function", function: t })),
        tool_choice: "auto",
        temperature: 0.5
      })
    });

    const data: any = await response.json();

    if (!response.ok) {
      console.error("Groq API Error:", data);
      return res.status(response.status).json({ 
        error: "Groq API Error", 
        details: data.error?.message || "Unknown error" 
      });
    }

    const choice = data.choices[0];
    const assistantMessage = choice.message;

    // Handle Tool Calls (Agentic Logic)
    if (assistantMessage.tool_calls) {
      // Here you would normally execute the local tasks
      // For now, we return the tool calls so the "Wristband" or "OpenClaw" client can handle them
      return res.json({
        role: "assistant",
        content: assistantMessage.content,
        tool_calls: assistantMessage.tool_calls,
        agent: "OpenClaw"
      });
    }

    return res.json({
      role: "assistant",
      content: assistantMessage.content,
      agent: "OpenClaw"
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

// Simple Chat Proxy for general use
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CONFIG.groq.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: CONFIG.groq.model,
        messages: [{ role: "user", content: message }]
      })
    });

    const data: any = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Groq Error");

    res.json({ content: data.choices[0].message.content });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("OpenClaw Serverless API is running.");
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

export default app;
