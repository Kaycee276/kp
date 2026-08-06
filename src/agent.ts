import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { KeeperGateToolkit } from "@keepergate/langchain";
import { createAgent } from "langchain";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";
import * as dotenv from "dotenv";
import * as readline from "readline";

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
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-3.5-flash", // or your preferred model
    temperature: 0,
    apiKey: process.env.GEMINI_API_KEY || "",
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
        try {
          const parsedArgs = JSON.parse(args.args);
          return await tool.invoke(parsedArgs);
        } catch (e: any) {
          return `Error parsing or executing tool: ${e.message}`;
        }
      },
    });
  });

  // 3. Create the Agent using LangGraph
  const agent = createAgent({
    model,
    tools: geminiCompatibleTools as any,
    systemPrompt:
      "You are KP, a helpful AI assistant that can execute onchain transactions using KeeperHub. Always explain what you are going to do before executing a transaction.",
  });

  // 4. Run the Agent interactively
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("\n🤖 KP is ready! Type your command (or 'exit' to quit):");

  const chatLoop = () => {
    rl.question("\n> ", async (input) => {
      if (input.toLowerCase() === "exit" || input.toLowerCase() === "quit") {
        rl.close();
        return;
      }

      if (!input.trim()) {
        chatLoop();
        return;
      }

      try {
        const result = await withRetry(async () => {
          return await agent.invoke({
            messages: [["human", input]],
          });
        });

        const lastMessage = result.messages[result.messages.length - 1];
        if (lastMessage) {
          console.log("\n✅ KP:", lastMessage.content);
        } else {
          console.log("\n✅ KP: No response.");
        }
      } catch (error: any) {
        console.error("\n❌ Agent execution failed:", error.message);
      }

      chatLoop();
    });
  };

  chatLoop();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
