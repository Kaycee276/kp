import { ChatOpenAI } from "@langchain/openai";
import { KeeperGateToolkit } from "@keepergate/langchain";
import { createAgent } from "langchain";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * A simple retry wrapper to handle transient errors (e.g., network issues, gas spikes).
 * This demonstrates robust failure handling for onchain execution.
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 2000,
): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      console.warn(
        `[Attempt ${i + 1}/${maxRetries}] Operation failed: ${error.message}`,
      );
      if (i < maxRetries - 1) {
        console.log(`Retrying in ${delayMs / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw new Error(
    `Operation failed after ${maxRetries} attempts. Last error: ${lastError.message}`,
  );
}

async function main() {
  // 1. Initialize the LLM
  const model = new ChatOpenAI({
    modelName: "gpt-4o", // or your preferred model
    temperature: 0,
  });

  // 2. Initialize the KeeperGate Toolkit
  // This automatically loads the tools available to your KeeperHub organization
  const apiKey = process.env.KEEPERHUB_API_KEY;
  if (!apiKey) {
    throw new Error("KEEPERHUB_API_KEY environment variable is missing.");
  }

  const toolkit = new KeeperGateToolkit({
    apiKey: apiKey,
  });
  const tools = await toolkit.getTools();

  console.log(`Loaded ${tools.length} KeeperHub tools.`);

  // 3. Create the Agent using LangGraph
  const agent = createAgent({
    model,
    tools: tools as any,
    systemPrompt:
      "You are a helpful AI assistant that can execute onchain transactions using KeeperHub. Always explain what you are going to do before executing a transaction.",
  });

  // 4. Run the Agent with Retry Logic
  const input =
    "Check my KeeperHub workflows. If I have a workflow for sending ETH, prepare a transaction to send 0.001 ETH to vitalik.eth, but DO NOT execute it yet. Just show me the prepared transaction data.";

  console.log(`\n🤖 Executing prompt: "${input}"\n`);

  try {
    const result = await withRetry(async () => {
      return await agent.invoke({
        messages: [["human", input]],
      });
    });

    const lastMessage = result.messages[result.messages.length - 1];
    if (lastMessage) {
      console.log("\n✅ Result:", lastMessage.content);
    } else {
      console.log("\n✅ Result: No response.");
    }
  } catch (error: any) {
    console.error("\n❌ Agent execution failed completely:", error);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
