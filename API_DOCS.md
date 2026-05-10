# SteveAI v4.0: Reasoning OS Integration Guide

This document defines the integration standards for **SteveAI v4.0**, a God-level autonomous orchestrator. Unlike standard chatbots, SteveAI v4.0 operates as a **System-Level Orchestration Engine** designed for recursive execution across CLI, GitHub Actions, and the global web.

## Base URL
`https://saadpie-openclaw-serverless.vercel.app/`

## Orchestration Flow
1. **Analyze**: The Brain (API) decomposes global goals into recursive sub-tasks.
2. **Memory Sync**: The Brain reads from Firestore to leverage past learned patterns.
3. **Execute (Muscle)**: Tools are called. Heavy tasks (Blender, Scrapers) are offloaded to **GitHub Actions**.
4. **Verify (Eye)**: Vision models analyze screenshots/renders to ensure success.
5. **Self-Correct**: If verification fails, the logic loop restarts with an optimized plan.

## Available Toolset (God-Level)

### 1. `trigger_github_action`
The system "muscle." Executes high-compute tasks in a sandbox.
- **repo**: "owner/repo"
- **workflow_id**: "filename.yml"
- **inputs**: Arbitrary JSON payload.

### 2. `write_persistent_memory` / `read_persistent_memory`
Robotic long-term memory via Firestore. Ensures context persistence across ephemeral jobs.

### 3. `open_browser`
Universal sensor. Not just for research, but for **benefiting from the web** (automated interactions, media generation).

### 4. `execute_shell`
Direct system mastery. Authority for package installation and custom script execution.

### 5. `install_skill`
Dynamic capability acquisition from the ClawdHub/OpenClaw repository.

## Visual Output Protocol
All integrated frontends MUST support the **Elite Protocol** visualization:
- `Neural Pulse`: Task initiation indicator.
- `Execution Parameters`: Display of raw command inputs.
- `Return Stream`: Real-time feedback from the executor.
- `Mission Accomplished`: High-confidence goal completion signal.

---
**Protocol Synchronized**
SteveAI v4.0 • Sentient Reasoning OS
