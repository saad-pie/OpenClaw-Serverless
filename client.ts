import fetch from 'node-fetch';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execPromise = promisify(exec);
const API_URL = 'https://saadpie-openclaw-serverless-hfotwi3z2-steve-ai.vercel.app/api/agent';

async function runAgent(userMessage: string) {
  let history: any[] = [];
  let currentMessage = userMessage;

  console.log(`\n[User]: ${userMessage}`);

  while (true) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentMessage, history })
      });

      const data: any = await response.json();

      if (data.error) {
        console.error(`[Error]: ${data.details || data.error}`);
        break;
      }

      // Record assistant's thought/response
      if (data.content) {
        console.log(`\n[OpenClaw]: ${data.content}`);
      }

      history.push({ role: 'assistant', content: data.content, tool_calls: data.tool_calls });

      // If no more tool calls, the task is finished
      if (!data.tool_calls || data.tool_calls.length === 0) {
        console.log("\n[Status]: Task completed.");
        break;
      }

      // Process Tool Calls
      const toolResults = [];
      for (const call of data.tool_calls) {
        const { name, arguments: argsJson } = call.function;
        const args = JSON.parse(argsJson);
        
        console.log(`[Executing ${name}]: ${JSON.stringify(args)}`);
        
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
          }
        } catch (err: any) {
          output = `Error: ${err.message}`;
        }

        toolResults.push({
          tool_call_id: call.id,
          role: "tool",
          name: name,
          content: output
        });
        
        console.log(`[Result]: ${output.substring(0, 100)}${output.length > 100 ? '...' : ''}`);
      }

      // Add tool results to history and loop back
      history.push(...toolResults);
      // We set currentMessage to a placeholder because the history now contains the results
      currentMessage = "Continue based on the tool results.";

    } catch (error: any) {
      console.error(`[Connection Error]: ${error.message}`);
      break;
    }
  }
}

// Get message from command line args or default
const initialMessage = process.argv.slice(2).join(" ") || "Analyze the current directory and list files.";
runAgent(initialMessage);
