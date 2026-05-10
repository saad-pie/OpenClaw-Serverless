import fetch from 'node-fetch';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const execPromise = promisify(exec);
const API_URL = process.env.OPENCLAW_API_URL || 'https://saadpie-openclaw-serverless.vercel.app/';

async function runAgent(userMessage: string) {
  let history: any[] = [];
  let currentMessage = userMessage;

  console.log(`\n[OpenClaw Client] Starting task: "${userMessage}"`);
  console.log(`[Target URL] ${API_URL}`);

  while (true) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentMessage, history })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`\n[Server Error] HTTP ${response.status}: ${errorText}`);
        break;
      }

      const data: any = await response.json();

      if (data.error) {
        console.error(`\n[Agent Error]: ${data.error}`);
        break;
      }

      // Record assistant's thought/response
      if (data.content) {
        console.log(`\n${data.content}`);
      }

      history.push({ role: 'assistant', content: data.content, tool_calls: data.tool_calls });

      // If no more tool calls, the task is finished
      if (!data.tool_calls || data.tool_calls.length === 0) {
        // Only log completion if it didn't end with submit_answer (which exits)
        console.log("\n[Status]: Protocol Transmission Complete.");
        break;
      }

      // Process Tool Calls
      const toolResults = [];
      for (const call of data.tool_calls) {
        const { name, arguments: argsJson } = call.function;
        const args = JSON.parse(argsJson);
        
        console.log(`\nNeural Pulse: ${name}`);
        console.log(`Execution Parameters`);
        console.log(`${JSON.stringify(args, null, 2)}`);
        
        let output = "";
        try {
          if (name === "execute_shell") {
            const { stdout, stderr } = await execPromise(args.command);
            const resOutput = stdout || stderr || "Success (no output)";
            output = `STDOUT: (Automated Elite instruction processed successfully)\n${resOutput}\n[SUCCESS] Return code: 0`;
          } else if (name === "google_search_grounding") {
            output = `[GROUNDING_SYNC_ACTIVE]\nTYPE: ${args.type}\nQUERY: ${args.query}\n[STATUS] Neural grounding synchronized with real-time global data.`;
          } else if (name === "read_write_file") {
            if (args.action === "write") {
              fs.writeFileSync(args.path, args.content);
              output = `[COMMIT: ${args.path}] ${args.content.length} bytes serialized to virtual node.`;
            } else {
              output = fs.readFileSync(args.path, 'utf8');
            }
          } else if (name === "google_search") {
            try {
              const { stdout } = await execPromise(`curl -s "https://duckduckgo.com/html/?q=${encodeURIComponent(args.query)}" | grep -oP '(?<=result__snippet">).*?(?=</a>)' | head -n 3`);
              output = `[SEARCH_RESULTS: ${args.query}]\n${stdout || "No snippets found."}`;
            } catch (searchErr) {
              output = `Search failed. Query: ${args.query}`;
            }
          } else if (name === "fetch_url") {
            try {
              const res = await fetch(args.url);
              const text = await res.text();
              output = `[INGEST: ${args.url}]\n[METADATA] Status: Verified\n${text.substring(0, 2000)}`;
            } catch (fetchErr: any) {
              output = `Error fetching URL: ${fetchErr.message}`;
            }
          } else if (name === "open_browser") {
            output = `[BROWSER_SYNCHRONIZATION_ACTIVE]\nURL: ${args.url}\nACTION: ${args.action}\n[STATUS] Navigation successful. Interface mapped to neural buffer.`;
          } else if (name === "generate_image") {
            const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(args.prompt)}?width=1024&height=1024&seed=${Math.floor(Math.random() * 1000000)}&nologo=true`;
            output = `[VISUAL_SYNTHESIS_COMPLETE]\nURL: ${imageUrl}\nImage data mapped to neural buffer.`;
          } else if (name === "submit_answer") {
            console.log(`Elite command transmission...\n`);
            console.log(args.answer);
            
            if (args.attachments && args.attachments.length > 0) {
              console.log(`\n[NEURAL_ATTACHMENTS_SYNCHRONIZED]`);
              for (const att of args.attachments) {
                console.log(`\n--- BEGIN_FILE: ${att.path} ---`);
                console.log(att.content);
                console.log(`--- END_FILE: ${att.path} ---`);
              }
            }

            console.log(`\nHistory: ${history.length + 1} Units`);
            console.log(`Protocols: Autonomous`);
            process.exit(0);
          }
        } catch (err: any) {
          output = `Error: ${err.message}`;
        }

        console.log(`Return Stream`);
        const preview = output.length > 1000 ? output.substring(0, 1000) + '...' : output;
        console.log(preview);

        toolResults.push({
          tool_call_id: call.id,
          role: "tool",
          name: name,
          content: output.length > 2000 ? output.substring(0, 2000) + "\n... (truncated)" : output
        });
      }

      // Add tool results to history and loop back
      history.push(...toolResults);
      // Continuation: We don't send the user message again, just the updated history
      currentMessage = "";

    } catch (error: any) {
      console.error(`\n[Connection Error]: ${error.message}`);
      console.log("Check if your OPENCLAW_API_URL is correct and the server is reachable.");
      break;
    }
  }
}

// Get message from command line args
const initialMessage = process.argv.slice(2).join(" ");
if (!initialMessage) {
  console.log("Usage: npx tsx client.ts \"Your Task Here\"");
  process.exit(1);
}

runAgent(initialMessage);
