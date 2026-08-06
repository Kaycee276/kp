# KP: Zero-to-One KeeperHub Agent Template 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?logo=next.js)](https://nextjs.org/)
[![KeeperHub](https://img.shields.io/badge/KeeperHub-Ready-0AB955)](https://keeperhub.com)
[![Gemini](https://img.shields.io/badge/Gemini-Powered-blue?logo=google)](https://ai.google.dev/)

A zero-to-one starter template for building AI agents that execute onchain transactions using [KeeperHub](https://keeperhub.com) and [LangChain](https://js.langchain.com/).

This template is specifically designed for the **KeeperHub Hackathon** to target the "Best Onboarding UX Improvement" bounty. It gets developers from zero to their first onchain transaction as fast as possible, with a **production-grade CLI and Web Dashboard experience**, and **completely for free** by integrating Google's Gemini API.

## 🌟 Why this template?

Many agent frameworks struggle with the "last mile" of execution—actually submitting transactions onchain reliably. KeeperHub solves this, but setting up the connection, managing API keys securely, and paying for LLM API keys (like OpenAI) can be a hurdle for new developers.

This template solves three major onboarding problems:

1. **Seamless UX (The Web Dashboard):** Instead of manually creating and editing `.env` files, users authenticate via a beautiful Next.js web dashboard using GitHub OAuth. The CLI uses a secure device authorization flow (similar to the GitHub CLI) to fetch the keys.
2. **Easy Integration:** It uses the official `@keepergate/langchain` adapter to seamlessly bridge LangChain's tool system with KeeperHub's execution layer.
3. **Free Execution (The Gemini Schema Wrapper):** KeeperHub's complex tool schemas (which use `.nullish()` and `$ref`) are natively built for OpenAI. If you try to pass them to Gemini, the API throws a `400 Bad Request` due to strict schema validation. **This template includes a custom schema wrapper** that simplifies the payloads on the fly, allowing you to use Gemini's free tier to power your onchain agents!

## 🏗️ Architecture

The project consists of two main components:

1. **The Web Dashboard (`/web`):** A Next.js App Router application deployed on Vercel. It uses NextAuth for GitHub authentication and a Neon PostgreSQL database (via Prisma) to securely store user API keys.
2. **The CLI Agent (`/src`):** A Node.js CLI application that implements the LangChain agent, the Gemini schema wrapper, and the device authorization polling flow.

## 🛠️ Prerequisites

- Node.js (v18+)
- A KeeperHub API Key (Get one at [app.keeperhub.com](https://app.keeperhub.com) -> Settings -> API Keys)
- A Gemini API Key (Get one for free at [Google AI Studio](https://aistudio.google.com/app/apikey))
- Some testnet ETH in your KeeperHub wallet (e.g., Sepolia ETH).

## 🚀 Quick Start

You can install KP globally and run it from anywhere on your computer!

1. **Clone the repository and build the CLI:**

   ```bash
   git clone https://github.com/Kaycee276/kp.git
   cd kp
   npm install
   npm run build
   npm link
   ```

2. **Run the agent:**

   ```bash
   kp
   ```

3. **Authorize your device:**

   The CLI will automatically generate a secure device code and open your browser to the KP Web Dashboard.
   - Sign in with GitHub.
   - Save your Gemini and KeeperHub API keys in the dashboard.
   - Click "Authorize Device".
   - The CLI will automatically detect the authorization and start the agent!

4. **Start chatting!**
   ```
   🤖 KP is ready! Type your command (or 'exit' to quit):
   > Send 0.001 ETH to vitalik.eth on Sepolia
   ```

## 🧠 How the Gemini Wrapper Works

If you look in `src/agent.ts`, you'll see the magic that makes Gemini compatible with KeeperHub.

Instead of passing the raw tools to the LLM (which causes schema validation errors), we wrap them in a new `DynamicStructuredTool`. We stringify the complex JSON schema and pass it in the tool's description, instructing the LLM to return a single JSON string argument (`args`).

```typescript
// Wrap tools for Gemini compatibility (Gemini rejects complex JSON schemas)
const geminiCompatibleTools = tools.map((tool: any) => {
  const schemaJson = JSON.stringify(zodToJsonSchema(tool.schema));
  return new DynamicStructuredTool({
    name: tool.name,
    description: `${tool.description}\n\nIMPORTANT: You must pass a single JSON string argument named 'args' that matches this schema: ${schemaJson}`,
    schema: z.object({
      args: z
        .string()
        .describe(
          "A JSON string containing all the required arguments for this tool.",
        ),
    }),
    func: async (args) => {
      const parsedArgs = JSON.parse(args.args);
      return await tool.invoke(parsedArgs);
    },
  });
});
```

This completely bypasses Gemini's strict schema validation while retaining 100% of the tool's functionality!

## 🏆 Hackathon Proof of Execution

This agent (named **KP**) has successfully executed onchain transactions via KeeperHub!

- **Network:** Sepolia
- **Action:** Transfer 0.001 ETH to `vitalik.eth`
- **Transaction Hash:** [`0x6bdfd39b1666933e826a967e8bf3161c3bef7093ff72e909c0cfb6af9c04c4d3`](https://sepolia.etherscan.io/tx/0x6bdfd39b1666933e826a967e8bf3161c3bef7093ff72e909c0cfb6af9c04c4d3)

## 📄 License

This project is licensed under the MIT License.
