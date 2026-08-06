# KP: Zero-to-One KeeperHub Agent Template (Gemini Edition) 🚀

A zero-to-one starter template for building AI agents that execute onchain transactions using [KeeperHub](https://keeperhub.com) and [LangChain](https://js.langchain.com/).

This template is specifically designed for the **KeeperHub Hackathon** to target the "Best Onboarding UX Improvement" bounty. It gets developers from zero to their first onchain transaction as fast as possible, and **completely for free** by integrating Google's Gemini API.

## 🌟 Why this template?

Many agent frameworks struggle with the "last mile" of execution—actually submitting transactions onchain reliably. KeeperHub solves this, but setting up the connection and paying for LLM API keys (like OpenAI) can be a hurdle for new developers.

This template solves two major onboarding problems:

1. **Easy Integration:** It uses the official `@keepergate/langchain` adapter to seamlessly bridge LangChain's tool system with KeeperHub's execution layer.
2. **Free Execution (The Gemini Schema Wrapper):** KeeperHub's complex tool schemas (which use `.nullish()` and `$ref`) are natively built for OpenAI. If you try to pass them to Gemini, the API throws a `400 Bad Request` due to strict schema validation. **This template includes a custom schema wrapper** that simplifies the payloads on the fly, allowing you to use Gemini's free tier to power your onchain agents!

## 🛠️ Prerequisites

- Node.js (v18+)
- A KeeperHub API Key (Get one at [app.keeperhub.com](https://app.keeperhub.com) -> Settings -> API Keys)
- A Gemini API Key (Get one for free at [Google AI Studio](https://aistudio.google.com/app/apikey))
- Some testnet ETH in your KeeperHub wallet (e.g., Sepolia ETH).

## 🚀 Quick Start

1. **Clone the repository and install dependencies:**

   ```bash
   git clone https://github.com/Kaycee276/kp.git
   cd kp
   npm install
   ```

2. **Set up your environment variables:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your `GEMINI_API_KEY` and `KEEPERHUB_API_KEY`.

3. **Run the agent:**
   ```bash
   npm start
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

_(Demo video link to be added here)_
