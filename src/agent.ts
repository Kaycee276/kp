import { ChatOpenAI } from "@langchain/openai";
import { KeeperHubToolkit } from "@keepergate/langchain";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function main() {
  // 1. Initialize the LLM
  const llm = new ChatOpenAI({
    modelName: "gpt-4o", // or your preferred model
    temperature: 0,
  });

  // 2. Initialize the KeeperHub Toolkit
  // This automatically loads the tools available to your KeeperHub organization
  const toolkit = new KeeperHubToolkit({
    apiKey: process.env.KEEPERHUB_API_KEY,
  });
  const tools = await toolkit.getTools();

  console.log(`Loaded ${tools.length} KeeperHub tools.`);

  // 3. Create the Agent Prompt
  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "You are a helpful AI assistant that can execute onchain transactions using KeeperHub. Always explain what you are going to do before executing a transaction.",
    ],
    ["human", "{input}"],
    new MessagesPlaceholder("agent_scratchpad"),
  ]);

  // 4. Create the Agent
  const agent = await createOpenAIFunctionsAgent({
    llm,
    tools,
    prompt,
  });

  const agentExecutor = new AgentExecutor({
    agent,
    tools,
    verbose: true,
  });

  // 5. Run the Agent
  const input =
    "Check my KeeperHub workflows and tell me what I have available.";
  console.log(`\nExecuting prompt: "${input}"\n`);

  const result = await agentExecutor.invoke({
    input,
  });

  console.log("\nResult:", result.output);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
