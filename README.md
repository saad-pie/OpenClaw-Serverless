# OpenClaw: General Purpose Agentic Template

This is a serverless-ready template for **OpenClaw**, an autonomous agent capable of planning, coding, and executing tasks in a sandboxed or remote environment.

## Key Features
- **Autonomous Reasoning**: Uses Groq's high-speed models (like `gpt-oss-120b`) for planning.
- **Dynamic Skill Installation**: The agent can use `npm install` or `pip install` via shell to acquire new capabilities on the fly.
- **Code Execution**: Designed to generate and run scripts locally.
- **Tool-Calling**: Includes a generalized `execute_shell` tool for interaction with the hosting environment.

## Deployment

1. **Vercel**: Connect this repo, set `GROQ_API_KEY`, and deploy.
2. **Security Note**: This agent is designed to run in a **sandboxed environment**. It executes shell commands with the permissions of the user starting the process. Ensure it is hosted in an isolated container or VM if used for high-risk tasks.

## API Endpoints

### POST `/api/agent`
The main autonomous entry point.

**Payload:**
```json
{
  "message": "Research vulnerable ports on 192.168.1.1 and generate a PDF report.",
  "history": []
}
```

## Example Tasks
- "Install the 'yt-dlp' library and download a video."
- "Write a python script to scrape this website, summarize it, and save it as a text file."
- "Generate a FFmpeg script to create a video from these images."
