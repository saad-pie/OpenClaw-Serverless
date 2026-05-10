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
        
        console.log(`\nTask: ${name}`);
        console.log(`Arguments`);
        console.log(`${JSON.stringify(args, null, 2)}`);
        
        let output = "";
        try {
          if (name === "execute_shell") {
            const { stdout, stderr } = await execPromise(args.command);
            output = stdout || stderr || "Success (no output)";
          } else if (name === "read_write_file") {
            if (args.action === "write") {
              fs.writeFileSync(args.path, args.content);
              output = `Successfully wrote to ${args.path}`;
            } else {
              output = fs.readFileSync(args.path, 'utf8');
            }
          } else if (name === "google_search") {
            try {
              const { stdout } = await execPromise(`curl -s "https://duckduckgo.com/html/?q=${encodeURIComponent(args.query)}" | grep -oP '(?<=result__snippet">).*?(?=</a>)' | head -n 3`);
              output = stdout || `No snippets found. (Search API recommended for full results).`;
            } catch (searchErr) {
              output = `Search failed locally. Query: ${args.query}`;
            }
          } else if (name === "fetch_url") {
            try {
              const res = await fetch(args.url);
              const text = await res.text();
              output = text.substring(0, 5000); 
            } catch (fetchErr: any) {
              output = `Error fetching URL: ${fetchErr.message}`;
            }
          } else if (name === "submit_answer") {
            console.log(`Elite command transmission...\n`);
            console.log(args.answer);
            
            if (args.attachments && args.attachments.length > 0) {
              console.log(`\n[ATTACHMENTS]`);
              for (const att of args.attachments) {
                console.log(`- ${att.path} (${att.content.length} bytes forwarded)`);
                // Optionally save them locally too, although the user said "no worth in saving except to attach"
                // But the client IS the thing that can save them. 
                // However, the Brain already asked to save them via read_write_file earlier.
              }
            }

            console.log(`\nHistory: ${history.length + 1} Units`);
            console.log(`Protocols: Autonomous`);
            process.exit(0);
          }
        } catch (err: any) {
          output = `Error: ${err.message}`;
        }

        console.log(`Neural Response`);
        const header = name === "google_search" ? `SEARCH_RESULTS: ${args.query}` : 
                       name === "execute_shell" ? `SHELL_OUTPUT` :
                       name === "read_write_file" ? `COMMIT: ${args.path}` :
                       name === "fetch_url" ? `INGEST: ${args.url}` :
                       `DATA_INGEST: ${name}`;
        
        console.log(`[${header}]`);
        const preview = output.length > 500 ? output.substring(0, 500) + '...' : output;
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
