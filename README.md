# KeeperHub LangChain Starter Template 🚀

A zero-to-one starter template for building AI agents that execute onchain transactions using [KeeperHub](https://keeperhub.com) and [LangChain](https://js.langchain.com/).

This template is designed to get you from zero to your first onchain transaction as fast as possible, bypassing common setup hurdles (like MCP server discovery issues) by using the official `@keepergate/langchain` adapter.

## Why this template?

Many agent frameworks struggle with the "last mile" of execution—actually submitting transactions onchain reliably. KeeperHub solves this, but setting up the connection can sometimes be tricky if your agent framework doesn't natively support custom MCP discovery protocols.

This template uses the official `@keepergate/langchain` adapter, which seamlessly bridges LangChain's tool system with KeeperHub's execution layer in just a few lines of code.

## Prerequisites

- Node.js (v18+)
- A KeeperHub API Key (Get one at [app.keeperhub.com](https://app.keeperhub.com) -> Settings -> API Keys)
- An OpenAI API Key (or modify `src/agent.ts` to use Anthropic/other providers)

## Quick Start

1. **Clone the repository and install dependencies:**

   ```bash
   npm install
   ```

2. **Set up your environment variables:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your `OPENAI_API_KEY` and `KEEPERHUB_API_KEY`.

3. **Run the agent:**
   ```bash
   npm start
   ```

## How it works

Check out `src/agent.ts`. The magic happens in these three lines:

```typescript
const toolkit = new KeeperGateToolkit({
  apiKey: process.env.KEEPERHUB_API_KEY,
});
const tools = await toolkit.getTools();
```

This automatically fetches all the workflows and actions available to your KeeperHub organization and converts them into LangChain-compatible tools. The LLM can then reason about these tools and execute them onchain!

## Hackathon Ready

This template was built for the KeeperHub Hackathon. Feel free to fork it, modify the agent's reasoning logic, and build something amazing!
