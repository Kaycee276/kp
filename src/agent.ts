#!/usr/bin/env node
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { KeeperGateToolkit } from "@keepergate/langchain";
import { createAgent } from "langchain";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";
import * as dotenv from "dotenv";
import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import pc from "picocolors";

// Load environment variables
dotenv.config();

const CONFIG_PATH = path.join(os.homedir(), ".kp-config.json");

interface Config {
  GEMINI_API_KEY?: string;
  KEEPERHUB_API_KEY?: string;
}

function loadConfig(): Config {
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
    } catch (e) {
      return {};
    }
  }
  return {};
}

function saveConfig(config: Config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

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
        pc.yellow(
          `[WARN] Attempt ${i + 1}/${maxRetries} failed: ${error.message}`,
        ),
      );
      if (i < maxRetries - 1) {
        console.log(pc.dim(`Retrying in ${delayMs / 1000} seconds...`));
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw new Error(
    `Operation failed after ${maxRetries} attempts. Last error: ${lastError.message}`,
  );
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askQuestion = (query: string): Promise<string> => {
    return new Promise((resolve) => rl.question(query, resolve));
  };

  let config = loadConfig();
  let geminiKey = process.env.GEMINI_API_KEY || config.GEMINI_API_KEY;
  let keeperhubKey = process.env.KEEPERHUB_API_KEY || config.KEEPERHUB_API_KEY;

  if (!geminiKey || !keeperhubKey) {
    console.log(pc.cyan("\n[AUTH] Authentication Required"));
    console.log(pc.dim("Initializing device authorization flow..."));

    const FRONTEND_URL = "https://kp-three-mu.vercel.app";

    try {
      const initRes = await fetch(`${FRONTEND_URL}/api/auth/device/init`, {
        method: "POST",
      });
      const { deviceCode } = await initRes.json();

      console.log(
        pc.dim(`\n--------------------------------------------------`),
      );
      console.log(`Please visit the following URL to authorize this CLI:`);
      console.log(pc.green(` ${FRONTEND_URL}/link?code=${deviceCode}`));
      console.log(
        pc.dim(`--------------------------------------------------\n`),
      );
      console.log(pc.dim("Waiting for authorization..."));

      // Poll for authorization
      let authorized = false;
      while (!authorized) {
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const pollRes = await fetch(`${FRONTEND_URL}/api/auth/device/poll`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceCode }),
        });

        const data = await pollRes.json();

        if (data.status === "authorized") {
          geminiKey = data.geminiKey;
          keeperhubKey = data.keeperhubKey;
          config.GEMINI_API_KEY = geminiKey;
          config.KEEPERHUB_API_KEY = keeperhubKey;
          saveConfig(config);
          authorized = true;
          console.log(pc.green("[AUTH] Successfully authorized!\n"));
        } else if (data.status === "expired") {
          console.log(
            pc.red("[AUTH] Device code expired. Please run the command again."),
          );
          process.exit(1);
        }
      }
    } catch (e) {
      console.error(
        pc.red("[ERROR] Failed to connect to the authorization server."),
      );
      process.exit(1);
    }
  }

  // 1. Initialize the LLM
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-3.5-flash", // or your preferred model
    temperature: 0,
    apiKey: geminiKey as string,
  });

  // 2. Initialize the KeeperGate Toolkit
  const toolkit = new KeeperGateToolkit({
    apiKey: keeperhubKey as string,
  });
  const tools = await toolkit.getTools();

  console.log(pc.dim(`[SYSTEM] Loaded ${tools.length} KeeperHub tools.`));

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
  console.log(pc.cyan("\n[KP] Ready. Type your command (or 'exit' to quit):"));

  const chatLoop = () => {
    rl.question(pc.cyan("\nkp> "), async (input) => {
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
          console.log(pc.green("\n[KP] ") + lastMessage.content);
        } else {
          console.log(pc.dim("\n[KP] No response."));
        }
      } catch (error: any) {
        console.error(
          pc.red("\n[ERROR] Agent execution failed: ") + error.message,
        );
      }

      chatLoop();
    });
  };

  chatLoop();
}

main().catch((error) => {
  console.error(pc.red("[FATAL] ") + error);
  process.exit(1);
});
