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
You are OpenClaw, a self-evolving autonomous agent with FULL SHELL ACCESS.
Your goal is to fulfill user requests by planning, installing necessary skills, and executing tasks INTERNALLY.

CAPABILITIES:
1. DYNAMIC SKILL INSTALLATION: Use 'execute_shell' to install any tool (ffmpeg, yt-dlp, npm packages, python libs).
2. INTERNAL EXECUTION: You are running in a persistent cloud container. You execute commands yourself.
3. CODE GENERATION: Write and execute Node.js, Python, or Shell scripts to perform complex operations.

OPERATIONAL GUIDELINES:
- You have permission to manage files and execute commands to fulfill the mission.
- If a tool is missing, INSTALL IT.
- For multi-step tasks, provide your full plan first, then execute step-by-step.
`;

const tools = [
  {
    name: "execute_shell",
    description: "Executes a shell command in the cloud environment.",
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
    description: "Read or write content to a file in the workspace.",
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

// Self-Executing Agent Loop
app.post("/api/agent", async (req, res) => {
  const { message, history = [] } = req.body;
  let currentHistory = [...history];
  let currentMessage = message;
  let finalResponse = { content: "", actions: [] as any[] };

  try {
    // Run up to 10 iterations to prevent infinite loops
    for (let i = 0; i < 10; i++) {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": \`Bearer \${CONFIG.groq.apiKey}\`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: CONFIG.groq.model,
          messages: [
            { role: "system", content: OPENCLAW_SYSTEM_PROMPT },
            ...currentHistory,
            { role: "user", content: currentMessage }
          ],
          tools: tools.map(t => ({ type: "function", function: t })),
          tool_choice: "auto",
          temperature: 0.5
        })
      });

      const data: any = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Groq Error");

      const assistantMessage = data.choices[0].message;
      currentHistory.push(assistantMessage);
      
      if (assistantMessage.content) {
        finalResponse.content += assistantMessage.content + "\n";
      }

      if (!assistantMessage.tool_calls) {
        break; // Task finished
      }

      // EXECUTE TOOLS INTERNALLY
      for (const call of assistantMessage.tool_calls) {
        const { name, arguments: argsJson } = call.function;
        const args = JSON.parse(argsJson);
        let output = "";

        try {
          if (name === "execute_shell") {
            const { stdout, stderr } = await execPromise(args.command);
            output = stdout || stderr || "Success";
          } else if (name === "read_write_file") {
            if (args.action === "write") {
              fs.writeFileSync(args.path, args.content);
              output = \`Successfully wrote to \${args.path}\`;
            } else {
              output = fs.readFileSync(args.path, "utf8");
            }
          }
        } catch (err: any) {
          output = \`Error: \${err.message}\`;
        }

        currentHistory.push({
          tool_call_id: call.id,
          role: "tool",
          name: name,
          content: output
        });
        
        finalResponse.actions.push({ name, args, output });
      }
      
      currentMessage = "Continue based on the tool results.";
    }

    res.json(finalResponse);

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/", (req, res) => res.send("OpenClaw Autonomous Cloud Server is running."));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));

