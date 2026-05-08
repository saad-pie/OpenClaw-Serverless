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
        console.log(`\n[THOUGHT]: ${data.content}`);
      }

      history.push({ role: 'assistant', content: data.content, tool_calls: data.tool_calls });

      // If no more tool calls, the task is finished
      if (!data.tool_calls || data.tool_calls.length === 0) {
        console.log("\n[Status]: Task completed successfully.");
        break;
      }

      // Process Tool Calls
      const toolResults = [];
      for (const call of data.tool_calls) {
        const { name, arguments: argsJson } = call.function;
        const args = JSON.parse(argsJson);
        
        console.log(`\n[Executing ${name}]: ${JSON.stringify(args, null, 2)}`);
        
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
          } else if (name === "submit_answer") {
            console.log(`\n[REASONING]:\n${args.reasoning}`);
            console.log(`\n[FINAL ANALYSIS]:\n${args.answer}`);
            process.exit(0);
          }
        } catch (err: any) {
          output = `Error: ${err.message}`;
          console.error(`[Execution Error]: ${err.message}`);
        }

        toolResults.push({
          tool_call_id: call.id,
          role: "tool",
          name: name,
          content: output.length > 2000 ? output.substring(0, 2000) + "\n... (truncated)" : output
        });
        
        const preview = output.length > 200 ? output.substring(0, 200) + '...' : output;
        console.log(`[Result]: ${preview}`);
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
