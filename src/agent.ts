#!/usr/bin/env node
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { KeeperGateToolkit } from "@keepergate/langchain";
import { Telegraf } from "telegraf";
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
  baseSepolia,
  arbitrum,
  arbitrumSepolia,
  optimism,
  optimismSepolia,
  polygon,
  polygonAmoy,
  sepolia,
  avalanche,
  bsc,
  fantom,
} from "viem/chains";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

// Load environment variables
dotenv.config();

const CONFIG_PATH = path.join(os.homedir(), ".kp-config.json");

// ANSI Color Codes
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
  dim: "\x1b[2m",
};

/**
  Formats markdown syntax for beautiful ANSI terminal rendering in CLI mode.
 */
function formatCliMarkdown(text: string): string {
  let formatted = text;

  // Code blocks ```language ... ```
  formatted = formatted.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const lines = code.trim().split("\n");
    const boxed = lines
      .map(
        (l: string) =>
          `  ${colors.dim}│${colors.reset} ${colors.yellow}${l}${colors.reset}`,
      )
      .join("\n");
    return `\n${colors.dim}┌─${lang ? `[ ${lang} ]` : "────────"}──${colors.reset}\n${boxed}\n${colors.dim}└──────────${colors.reset}\n`;
  });

  // Headers (# Header)
  formatted = formatted.replace(/^### (.*$)/gm, `${colors.cyan}${colors.bold}▸ $1${colors.reset}`);
  formatted = formatted.replace(/^## (.*$)/gm, `\n${colors.yellow}${colors.bold}■ $1${colors.reset}`);
  formatted = formatted.replace(/^# (.*$)/gm, `\n${colors.green}${colors.bold}█ $1${colors.reset}`);

  // Bold **text**
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, `${colors.bold}$1${colors.reset}`);

  // Inline code `code`
  formatted = formatted.replace(/`([^`]+)`/g, `${colors.cyan}$1${colors.reset}`);

  // Bullet lists (* item or - item)
  formatted = formatted.replace(/^[\*\-] (.*$)/gm, `  ${colors.cyan}•${colors.reset} $1`);

  return formatted;
}

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
  TELEGRAM_BOT_TOKEN?: string;
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
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

async function getKeeperHubUser(apiKey: string) {
  try {
    const res = await fetch("https://app.keeperhub.com/api/user", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // Ignore errors
  }
  return null;
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

  const isTgBot = process.argv.includes("--tg-bot");

  if (!geminiKey || !keeperhubKey) {
    console.log(
      `${colors.cyan}\n[AUTH] Authentication Required${colors.reset}`,
    );
    console.log(
      `${colors.dim}Initializing device authorization flow...${colors.reset}`,
    );

    const FRONTEND_URL =
      process.env.FRONTEND_URL || "https://kp-three-mu.vercel.app";

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
          geminiKey =
            data.geminiKey ||
            process.env.GEMINI_API_KEY ||
            process.env.GOOGLE_API_KEY ||
            config.GEMINI_API_KEY ||
            "";
          keeperhubKey =
            data.keeperhubKey ||
            process.env.KEEPERHUB_API_KEY ||
            config.KEEPERHUB_API_KEY ||
            "";

          if (geminiKey) config.GEMINI_API_KEY = geminiKey;
          if (keeperhubKey) config.KEEPERHUB_API_KEY = keeperhubKey;
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

  if (!geminiKey) {
    geminiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      config.GEMINI_API_KEY ||
      "";
  }

  if (!geminiKey) {
    console.log(
      `${colors.yellow}\n[NOTE] Gemini API Key not found.${colors.reset}`,
    );
    geminiKey = await askQuestion(
      "Please enter your Gemini API Key (or press Enter to skip if set in environment): ",
    );
    geminiKey = geminiKey.trim();
    if (geminiKey) {
      config.GEMINI_API_KEY = geminiKey;
      saveConfig(config);
    }
  }

  if (geminiKey) {
    process.env.GOOGLE_API_KEY = geminiKey;
    process.env.GEMINI_API_KEY = geminiKey;
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
    eth: mainnet,
    mainnet: mainnet,
    sepolia: sepolia,
    "eth-sepolia": sepolia,
    base: base,
    "base-sepolia": baseSepolia,
    basesepolia: baseSepolia,
    arbitrum: arbitrum,
    "arbitrum-sepolia": arbitrumSepolia,
    arbitrumsepolia: arbitrumSepolia,
    optimism: optimism,
    op: optimism,
    "optimism-sepolia": optimismSepolia,
    opsepolia: optimismSepolia,
    polygon: polygon,
    matic: polygon,
    "polygon-amoy": polygonAmoy,
    amoy: polygonAmoy,
    avalanche: avalanche,
    avax: avalanche,
    bsc: bsc,
    binance: bsc,
    fantom: fantom,
  };

  const getEvmBalanceTool = new DynamicStructuredTool({
    name: "get_evm_balance",
    description:
      "Get the native token balance (ETH, MATIC, AVAX, BNB, FTM, etc.) of an EVM address on a specific network.",
    schema: z.object({
      address: z.string().describe("The EVM address to check (e.g., 0x...)."),
      network: z
        .enum([
          "ethereum",
          "sepolia",
          "base",
          "base-sepolia",
          "arbitrum",
          "arbitrum-sepolia",
          "optimism",
          "optimism-sepolia",
          "polygon",
          "polygon-amoy",
          "avalanche",
          "bsc",
          "fantom",
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

  const allTools = [...tools, getEvmBalanceTool, getSolanaBalanceTool];

  console.log(
    `${colors.dim}[SYSTEM] Loaded ${allTools.length} tools (KeeperHub + Read Capabilities).${colors.reset}`,
  );

  const spinner = new Spinner();

function isWriteOrSendAction(toolName: string): boolean {
  const readOnlyPrefixes = ["get_", "read_", "check_", "list_", "fetch_", "view_"];
  const lower = toolName.toLowerCase();
  if (readOnlyPrefixes.some((prefix) => lower.startsWith(prefix))) {
    return false;
  }
  return true;
}

  // Wrap tools for Gemini compatibility (Gemini rejects complex JSON schemas)
  const geminiCompatibleTools = allTools.map((tool: any) => {
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

          const isWrite = isWriteOrSendAction(tool.name);

          if (!isTgBot && isWrite) {
            spinner.stop();
            console.log(
              `\n${colors.yellow}[CONFIRMATION REQUIRED - SENDING TRANSACTION]${colors.reset}`,
            );
            console.log(
              `The agent wants to execute: ${colors.cyan}${tool.name}${colors.reset}`,
            );
            console.log(
              `Arguments: ${colors.dim}${JSON.stringify(parsedArgs, null, 2)}${colors.reset}`,
            );

            const answer = await askQuestion(
              `${colors.yellow}Are you sure you want to send/execute this transaction? (y/N): ${colors.reset}`,
            );

            if (
              answer.toLowerCase() !== "y" &&
              answer.toLowerCase() !== "yes"
            ) {
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
          }

          return await tool.invoke(parsedArgs);
        } catch (e: any) {
          return `Error parsing or executing tool: ${e.message}`;
        }
      },
    });
  });

  const userProfile = await getKeeperHubUser(keeperhubKey as string);
  const evmWalletAddress = userProfile?.walletAddress;
  const solanaWalletAddress = userProfile?.solanaWalletAddress;

  let systemPrompt =
    "You are KP, a helpful AI assistant that can execute onchain transactions using KeeperHub. Always explain what you are going to do before executing a transaction.\n\n" +
    "SUPPORTED NETWORKS & CHAINS:\n" +
    "• EVM: Ethereum Mainnet, Sepolia, Base, Base Sepolia, Arbitrum One, Arbitrum Sepolia, Optimism, Optimism Sepolia, Polygon PoS, Polygon Amoy, Avalanche C-Chain, BNB Smart Chain (BSC), Fantom.\n" +
    "• Solana: Solana Mainnet-Beta, Solana Devnet.\n\n" +
    "CRITICAL INSTRUCTIONS:\n" +
    "1. NETWORK SELECTION FOR BALANCE QUERIES: If the user asks to check their balance or check their wallet without specifying a target network/chain (e.g. 'What is my wallet balance?'), DO NOT attempt to query multiple networks automatically. Instead, ask the user to specify which network they want to check (e.g., Sepolia, Base Sepolia, Ethereum, Base, Arbitrum, Optimism, Polygon, Solana, etc.).\n" +
    "2. READ vs WRITE: Read queries (like balance checks) are information-only. Write operations (transfers, token sends, contract executions) send crypto out.";

  if (evmWalletAddress) {
    systemPrompt += `\n\nThe user's KeeperHub EVM wallet address is ${evmWalletAddress}. If they ask to check their EVM balance or perform an EVM action without specifying an address, use this address.`;
  }

  if (solanaWalletAddress) {
    systemPrompt += `\n\nThe user's KeeperHub Solana wallet address is ${solanaWalletAddress}. If they ask to check their Solana balance or perform a Solana action without specifying an address, use this address.`;
  }

  // 3. Create the Agent using LangGraph
  const agent = createAgent({
    model,
    tools: geminiCompatibleTools as any,
    systemPrompt,
  });

  if (isTgBot) {
    let tgToken = process.env.TELEGRAM_BOT_TOKEN || config.TELEGRAM_BOT_TOKEN;
    if (!tgToken) {
      tgToken = await askQuestion(
        `${colors.yellow}Enter your Telegram Bot Token (from BotFather): ${colors.reset}`,
      );
      config.TELEGRAM_BOT_TOKEN = tgToken;
      saveConfig(config);
    }

    const bot = new Telegraf(tgToken);

    bot.start((ctx) => {
      ctx.reply(
        "🤖 KP Telegram Bot is online! Send me a command to execute onchain transactions.",
      );
    });

    bot.on("text", async (ctx) => {
      const input = ctx.message.text;
      const msg = await ctx.reply("⏳ Agent is thinking and executing...");

      try {
        const result = await withRetry(async () => {
          return await agent.invoke({
            messages: [["human", input]],
          });
        });

        const lastMessage = result.messages[result.messages.length - 1];
        if (lastMessage) {
          await ctx.telegram.editMessageText(
            ctx.chat.id,
            msg.message_id,
            undefined,
            `✅ ${lastMessage.content}`,
          );
        } else {
          await ctx.telegram.editMessageText(
            ctx.chat.id,
            msg.message_id,
            undefined,
            "❌ No response from agent.",
          );
        }
      } catch (error: any) {
        await ctx.telegram.editMessageText(
          ctx.chat.id,
          msg.message_id,
          undefined,
          `❌ Error: ${error.message}`,
        );
      }
    });

    console.log(
      `${colors.green}\n[KP] Telegram Bot is running! Press Ctrl+C to stop.${colors.reset}`,
    );
    bot.launch();

    // Enable graceful stop
    process.once("SIGINT", () => bot.stop("SIGINT"));
    process.once("SIGTERM", () => bot.stop("SIGTERM"));
    return;
  }

// Cached list of available models fetched dynamically from Gemini API
let cachedGeminiModelsCli: string[] | null = null;
let currentModelIndexCli = 0;

async function getAvailableGeminiModelsCli(apiKey: string): Promise<string[]> {
  if (cachedGeminiModelsCli && cachedGeminiModelsCli.length > 0) {
    return cachedGeminiModelsCli;
  }

  const preferredOrder = [
    "gemini-3.5-flash",
    "gemini-3.6-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
    "gemini-2.5-pro",
  ];

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    );
    if (!res.ok) {
      cachedGeminiModelsCli = preferredOrder;
      return preferredOrder;
    }
    const data = await res.json();
    const available = (data.models || [])
      .filter((m: any) =>
        m.supportedGenerationMethods?.includes("generateContent"),
      )
      .map((m: any) => m.name.replace("models/", ""));

    const sorted = preferredOrder.filter((m) => available.includes(m));
    for (const m of available) {
      if (
        !sorted.includes(m) &&
        !m.includes("image") &&
        !m.includes("tts") &&
        !m.includes("clip") &&
        !m.includes("robotics") &&
        !m.includes("research") &&
        !m.includes("gemma")
      ) {
        sorted.push(m);
      }
    }

    cachedGeminiModelsCli = sorted.length > 0 ? sorted : preferredOrder;
    return cachedGeminiModelsCli;
  } catch (e) {
    cachedGeminiModelsCli = preferredOrder;
    return preferredOrder;
  }
}

async function invokeAgentWithModelFallback(
  geminiKey: string,
  tools: any[],
  systemPrompt: string,
  inputMessages: any[],
) {
  const models = await getAvailableGeminiModelsCli(geminiKey);
  let attemptsCount = 0;
  const maxAttempts = models.length * 3;

  while (attemptsCount < maxAttempts) {
    const modelName = models[currentModelIndexCli] || "gemini-3.5-flash";
    try {
      const model = new ChatGoogleGenerativeAI({
        model: modelName,
        temperature: 0,
        apiKey: geminiKey,
      });

      const agent = createAgent({
        model,
        tools: tools as any,
        systemPrompt,
      });

      const response = await agent.invoke({ messages: inputMessages });
      // Keep currentModelIndexCli at this working model for future calls!
      return response;
    } catch (error: any) {
      attemptsCount++;
      const isQuotaOrRateLimit =
        error?.status === 429 ||
        error?.message?.includes("429") ||
        error?.message?.includes("Quota exceeded") ||
        error?.message?.includes("Too Many Requests") ||
        error?.message?.includes("rate-limits");

      const isNotFound =
        error?.status === 404 || error?.message?.includes("404");

      if (isQuotaOrRateLimit || isNotFound) {
        currentModelIndexCli = (currentModelIndexCli + 1) % models.length;

        if (attemptsCount % models.length === 0) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }

        continue;
      }

      throw error;
    }
  }

  throw new Error("Exhausted all available Gemini fallback models after retrying.");
}

  // 4. Run the Agent interactively (CLI mode)
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
          return await invokeAgentWithModelFallback(
            geminiKey as string,
            geminiCompatibleTools,
            systemPrompt,
            [["human", input]],
          );
        });

        spinner.stop();

        const lastMessage = result.messages[result.messages.length - 1];
        if (lastMessage && lastMessage.content) {
          const formatted = formatCliMarkdown(String(lastMessage.content));
          console.log(
            `${colors.green}\n[KP] ${colors.reset}${formatted}`,
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
