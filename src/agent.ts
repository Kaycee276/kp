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
import { createPublicClient, http, formatEther } from "viem";
import {
  mainnet,
  base,
  arbitrum,
  optimism,
  polygon,
  sepolia,
} from "viem/chains";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

// Load environment variables
dotenv.config();

const CONFIG_PATH = path.join(os.homedir(), ".kp-config.json");

// ANSI Color Codes
const colors = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  dim: "\x1b[2m",
};

class Spinner {
  private timer: NodeJS.Timeout | null = null;
  private frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  private i = 0;

  start(text: string) {
    this.i = 0;
    process.stdout.write(`\x1b[?25l`); // hide cursor
    this.timer = setInterval(() => {
      process.stdout.write(
        `\r${colors.cyan}${this.frames[this.i]}${colors.reset} ${text}`,
      );
      this.i = (this.i + 1) % this.frames.length;
    }, 80);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    process.stdout.write(`\r\x1b[2K\x1b[?25h`); // clear line and show cursor
  }
}

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
        `${colors.yellow}[WARN] Attempt ${i + 1}/${maxRetries} failed: ${error.message}${colors.reset}`,
      );
      if (i < maxRetries - 1) {
        console.log(
          `${colors.dim}Retrying in ${delayMs / 1000} seconds...${colors.reset}`,
        );
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
    console.log(
      `${colors.cyan}\n[AUTH] Authentication Required${colors.reset}`,
    );
    console.log(
      `${colors.dim}Initializing device authorization flow...${colors.reset}`,
    );

    const FRONTEND_URL = "https://kp-three-mu.vercel.app";

    try {
      const initRes = await fetch(`${FRONTEND_URL}/api/auth/device/init`, {
        method: "POST",
      });
      const { deviceCode } = await initRes.json();

      console.log(
        `${colors.dim}\n--------------------------------------------------${colors.reset}`,
      );
      console.log(`Please visit the following URL to authorize this CLI:`);
      console.log(
        `${colors.green} ${FRONTEND_URL}/link?code=${deviceCode}${colors.reset}`,
      );
      console.log(
        `${colors.dim}--------------------------------------------------\n${colors.reset}`,
      );
      console.log(`${colors.dim}Waiting for authorization...${colors.reset}`);

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
          console.log(
            `${colors.green}[AUTH] Successfully authorized!\n${colors.reset}`,
          );
        } else if (data.status === "expired") {
          console.log(
            `${colors.red}[AUTH] Device code expired. Please run the command again.${colors.reset}`,
          );
          process.exit(1);
        }
      }
    } catch (e) {
      console.error(
        `${colors.red}[ERROR] Failed to connect to the authorization server.${colors.reset}`,
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

  const evmChains: Record<string, any> = {
    ethereum: mainnet,
    base,
    arbitrum,
    optimism,
    polygon,
    sepolia,
  };

  const getEvmBalanceTool = new DynamicStructuredTool({
    name: "get_evm_balance",
    description:
      "Get the native token balance (ETH, MATIC, etc.) of an EVM address on a specific network.",
    schema: z.object({
      address: z.string().describe("The EVM address to check (e.g., 0x...)."),
      network: z
        .enum([
          "ethereum",
          "base",
          "arbitrum",
          "optimism",
          "polygon",
          "sepolia",
        ])
        .describe("The network to check the balance on."),
    }),
    func: async ({ address, network }) => {
      try {
        const chain = evmChains[network];
        if (!chain) return `Error: Unsupported network ${network}`;

        const client = createPublicClient({
          chain,
          transport: http(),
        });

        const balance = await client.getBalance({
          address: address as `0x${string}`,
        });
        return `The balance of ${address} on ${network} is ${formatEther(balance)} native tokens.`;
      } catch (e: any) {
        return `Error fetching balance: ${e.message}`;
      }
    },
  });

  const getSolanaBalanceTool = new DynamicStructuredTool({
    name: "get_solana_balance",
    description: "Get the SOL balance of a Solana address.",
    schema: z.object({
      address: z.string().describe("The Solana address to check."),
      network: z
        .enum(["mainnet", "devnet"])
        .describe("The Solana network to check (mainnet or devnet)."),
    }),
    func: async ({ address, network }) => {
      try {
        const endpoint =
          network === "devnet"
            ? "https://api.devnet.solana.com"
            : "https://api.mainnet-beta.solana.com";

        const connection = new Connection(endpoint);
        const pubKey = new PublicKey(address);
        const balance = await connection.getBalance(pubKey);

        return `The balance of ${address} on Solana ${network} is ${balance / LAMPORTS_PER_SOL} SOL.`;
      } catch (e: any) {
        return `Error fetching Solana balance: ${e.message}`;
      }
    },
  });

  tools.push(getEvmBalanceTool);
  tools.push(getSolanaBalanceTool);

  console.log(
    `${colors.dim}[SYSTEM] Loaded ${tools.length} tools (KeeperHub + Read Capabilities).${colors.reset}`,
  );

  const spinner = new Spinner();

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

          spinner.stop();
          console.log(
            `\n${colors.yellow}[CONFIRMATION REQUIRED]${colors.reset}`,
          );
          console.log(
            `The agent wants to execute: ${colors.cyan}${tool.name}${colors.reset}`,
          );
          console.log(
            `Arguments: ${colors.dim}${JSON.stringify(parsedArgs, null, 2)}${colors.reset}`,
          );

          const answer = await askQuestion(
            `${colors.yellow}Proceed? (y/N): ${colors.reset}`,
          );

          if (answer.toLowerCase() !== "y" && answer.toLowerCase() !== "yes") {
            console.log(
              `${colors.red}[REJECTED] Transaction cancelled by user.${colors.reset}`,
            );
            spinner.start("Agent is thinking...");
            return "User rejected the transaction. Do not attempt to execute it again. Ask the user what they want to do next.";
          }

          console.log(
            `${colors.green}[APPROVED] Executing transaction...${colors.reset}`,
          );
          spinner.start("Executing onchain transaction...");
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
  console.log(
    `${colors.cyan}\n[KP] Ready. Type your command (or 'exit' to quit):${colors.reset}`,
  );

  const chatLoop = () => {
    rl.question(`${colors.cyan}\nkp> ${colors.reset}`, async (input) => {
      if (input.toLowerCase() === "exit" || input.toLowerCase() === "quit") {
        rl.close();
        return;
      }

      if (!input.trim()) {
        chatLoop();
        return;
      }

      spinner.start("Agent is thinking and executing...");

      try {
        const result = await withRetry(async () => {
          return await agent.invoke({
            messages: [["human", input]],
          });
        });

        spinner.stop();

        const lastMessage = result.messages[result.messages.length - 1];
        if (lastMessage) {
          console.log(
            `${colors.green}\n[KP] ${colors.reset}` + lastMessage.content,
          );
        } else {
          console.log(`${colors.dim}\n[KP] No response.${colors.reset}`);
        }
      } catch (error: any) {
        spinner.stop();
        console.error(
          `${colors.red}\n[ERROR] Agent execution failed: ${colors.reset}` +
            error.message,
        );
      }

      chatLoop();
    });
  };

  chatLoop();
}

main().catch((error) => {
  console.error(`${colors.red}[FATAL] ${colors.reset}` + error);
  process.exit(1);
});
