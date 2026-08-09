import dns from "dns";
import https from "https";
dns.setDefaultResultOrder("ipv4first");

import { Telegraf } from "telegraf";
import { PrismaClient } from "@prisma/client";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { KeeperGateToolkit } from "@keepergate/langchain";
import { createAgent } from "langchain";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";
import * as dotenv from "dotenv";
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

dotenv.config();
dotenv.config({ path: "./web/.env" });

const { Pool } = pg;
const dbUrl = process.env.DATABASE_URL || "";
const pool = new Pool({
  connectionString: dbUrl,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// In-memory cache & fallback for database queries to prevent timeout crashes
const userCache = new Map<string, any>();

async function dbRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      if (i < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
      }
    }
  }
  throw lastErr;
}

async function getOrCreateTelegramUser(chatId: string) {
  if (userCache.has(chatId)) {
    return userCache.get(chatId);
  }
  try {
    const user = await dbRetry(async () => {
      let u = await prisma.telegramUser.findUnique({ where: { chatId } });
      if (!u) {
        u = await prisma.telegramUser.create({ data: { chatId } });
      }
      return u;
    });
    userCache.set(chatId, user);
    return user;
  } catch (err) {
    const fallbackUser = { id: chatId, chatId, keeperhubKey: null };
    userCache.set(chatId, fallbackUser);
    return fallbackUser;
  }
}

async function updateTelegramUserKey(chatId: string, keeperhubKey: string) {
  try {
    const updated = await dbRetry(async () => {
      return await prisma.telegramUser.update({
        where: { chatId },
        data: { keeperhubKey },
      });
    });
    userCache.set(chatId, updated);
    return updated;
  } catch (err) {
    const cached = userCache.get(chatId) || { id: chatId, chatId };
    cached.keeperhubKey = keeperhubKey;
    userCache.set(chatId, cached);
    return cached;
  }
}

const rawToken = process.env.TELEGRAM_BOT_TOKEN || "";
const botToken = rawToken.trim().replace(/^["']|["']$/g, "");

if (!botToken) {
  console.error("❌ TELEGRAM_BOT_TOKEN environment variable is not set in .env!");
  process.exit(1);
}

// Force IPv4 HTTPS Agent to prevent Node 18+ IPv6 DNS timeout issues
const ipv4Agent = new https.Agent({ family: 4, keepAlive: true });
const bot = new Telegraf(botToken, {
  telegram: {
    agent: ipv4Agent,
  },
});

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

// Retry helper for handling transient network errors
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

// Fetch user profile from KeeperHub
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

// Validate Gemini API Key
async function validateGeminiKey(apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    );
    return res.ok;
  } catch (e) {
    return false;
  }
}

// Formats Telegram response text, preserving links for 1-tap browser opening while wrapping wallet addresses in backticks for tap-to-copy
function formatTelegramText(text: string): string {
  let clean = text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/```[\s\S]*?```/g, (block) => {
      return block.replace(/```\w*\n?/g, "").trim();
    })
    .replace(/^#+\s+/gm, "")
    .trim();

  // Convert standalone 66-char EVM transaction hashes (0x + 64 hex) to 1-tap Etherscan browser links if not already linked
  clean = clean.replace(
    /(?<!\(|\/|`)(0x[a-fA-F0-9]{64})(?!`|\))/g,
    "[View Transaction on Explorer](https://sepolia.etherscan.io/tx/$1)",
  );

  // Wrap 42-char EVM wallet addresses (0x + 40 hex) in backticks so tapping them copies to clipboard
  clean = clean.replace(/(?<!`|\/)(0x[a-fA-F0-9]{40})(?!`|\/)/g, "`$1`");

  // Wrap Solana base58 wallet addresses in backticks for tap-to-copy
  clean = clean.replace(/(?<!`|\/)\b([1-9A-HJ-NP-Za-km-z]{32,44})\b(?!`|\/)/g, (match) => {
    if (/^(http|https|KeeperHub|Ethereum|Arbitrum|Optimism|Polygon|Sepolia|Solana|Telegram)/i.test(match)) {
      return match;
    }
    if (/[a-z]/.test(match) && /[A-Z]/.test(match) && match.length >= 32) {
      return "`" + match + "`";
    }
    return match;
  });

  return clean;
}

// Mask API key for profile view
function maskKey(key: string | null | undefined): string {
  if (!key) return "Not set";
  if (key.length <= 8) return "••••••••";
  return `${key.substring(0, 4)}••••${key.substring(key.length - 4)}`;
}

// In-memory conversation history per chat ID
const chatHistories = new Map<string, Array<[string, string]>>();
const MAX_HISTORY_LENGTH = 10;

// State machine for onboarding input steps (Single-step KeeperHub setup)
const userStates = new Map<string, "AWAITING_KEEPERHUB">();

// Cached list of available models fetched dynamically from Gemini API
let cachedGeminiModels: string[] | null = null;
let currentModelIndex = 0;

async function getAvailableGeminiModels(apiKey: string): Promise<string[]> {
  if (cachedGeminiModels && cachedGeminiModels.length > 0) {
    return cachedGeminiModels;
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
      cachedGeminiModels = preferredOrder;
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

    cachedGeminiModels = sorted.length > 0 ? sorted : preferredOrder;
    return cachedGeminiModels;
  } catch (e) {
    cachedGeminiModels = preferredOrder;
    return preferredOrder;
  }
}

async function invokeAgentWithModelFallback(
  geminiKey: string,
  tools: any[],
  systemPrompt: string,
  inputMessages: any[],
) {
  const models = await getAvailableGeminiModels(geminiKey);
  let attemptsCount = 0;
  const maxAttempts = models.length * 3;

  while (attemptsCount < maxAttempts) {
    const modelName = models[currentModelIndex] || "gemini-3.5-flash";
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
      // Keep currentModelIndex at this working model for future calls!
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
        currentModelIndex = (currentModelIndex + 1) % models.length;

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

async function runAgentForUser(keeperhubKey: string, history: any[]) {
  const rawGemini = process.env.GEMINI_API_KEY || "";
  const geminiKey = rawGemini.trim().replace(/^["']|["']$/g, "");
  if (!geminiKey) {
    throw new Error("Centralized GEMINI_API_KEY environment variable is missing on server!");
  }

  const toolkit = new KeeperGateToolkit({ apiKey: keeperhubKey });
  const tools = await toolkit.getTools();

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
        const client = createPublicClient({ chain, transport: http() });
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
          return await tool.invoke(parsedArgs);
        } catch (e: any) {
          return `Error parsing or executing tool: ${e.message}`;
        }
      },
    });
  });

  const userProfile = await getKeeperHubUser(keeperhubKey);
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

  return await invokeAgentWithModelFallback(
    geminiKey,
    geminiCompatibleTools,
    systemPrompt,
    history,
  );
}

// Command: /start
bot.start(async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const user = await getOrCreateTelegramUser(chatId);

  if (user.keeperhubKey) {
    return ctx.reply(
      "🤖 Welcome back to KP Onchain AI Agent!\n\n" +
        "Your KeeperHub account is connected and ready. Ask me to check balances or run transactions.\n\n" +
        "• /profile - View setup & wallet addresses\n" +
        "• /reset - Update your KeeperHub API key\n" +
        "• /clear - Reset conversation memory\n" +
        "• /help - View commands and help",
    );
  }

  userStates.set(chatId, "AWAITING_KEEPERHUB");
  return ctx.reply(
    "👋 Welcome to KP Onchain AI Agent!\n\n" +
      "To get started, please reply with your KeeperHub API Key.\n" +
      "(Get your API key at https://app.keeperhub.com -> Settings -> API Keys)\n\n" +
      "Send /cancel anytime to abort.",
  );
});

// Command: /help
bot.command("help", (ctx) => {
  return ctx.reply(
    "🤖 KP Onchain AI Agent Help\n\n" +
      "KP allows you to query balances and execute onchain transactions directly from Telegram using KeeperHub!\n\n" +
      "Available Actions:\n" +
      "• Check EVM balances (Ethereum, Base, Arbitrum, Optimism, Polygon, Sepolia)\n" +
      "• Check Solana balances (Mainnet, Devnet)\n" +
      "• Execute transfers, contract interactions & automation via KeeperHub\n\n" +
      "Bot Commands:\n" +
      "• /profile - Check connected wallets & API key status\n" +
      "• /reset - Update your KeeperHub API key\n" +
      "• /clear - Clear chat conversation memory\n" +
      "• /cancel - Cancel active key input prompt\n" +
      "• /help - Show this message",
  );
});

// Command: /profile or /status
const handleProfile = async (ctx: any) => {
  const chatId = ctx.chat.id.toString();
  const user = await getOrCreateTelegramUser(chatId);

  if (!user || !user.keeperhubKey) {
    return ctx.reply(
      "⚠️ You haven't connected your KeeperHub API Key yet. Send /start to begin setup.",
    );
  }

  const statusMsg = await ctx.reply("⏳ Fetching wallet profile...");
  const keeperProfile = await getKeeperHubUser(user.keeperhubKey);

  const evmAddr = keeperProfile?.walletAddress;
  const solAddr = keeperProfile?.solanaWalletAddress;

  const msg =
    "👤 KP User Profile\n\n" +
    `• KeeperHub Key: \`${maskKey(user.keeperhubKey)}\`\n\n` +
    "💳 Connected KeeperHub Wallets (Tap address to copy):\n" +
    `• EVM Address: ${evmAddr ? `\`${evmAddr}\`` : "Not connected / Invalid key"}\n` +
    `• Solana Address: ${solAddr ? `\`${solAddr}\`` : "Not connected / Invalid key"}`;

  await ctx.telegram.editMessageText(
    chatId,
    statusMsg.message_id,
    undefined,
    msg,
    { parse_mode: "Markdown" },
  );
};

bot.command("profile", handleProfile);
bot.command("status", handleProfile);

// Command: /reset or /keys
const handleReset = async (ctx: any) => {
  const chatId = ctx.chat.id.toString();
  userStates.set(chatId, "AWAITING_KEEPERHUB");
  return ctx.reply(
    "🔄 Resetting KeeperHub API Key\n\n" +
      "Please reply with your new KeeperHub API Key.\n" +
      "Send /cancel to abort.",
  );
};

bot.command("reset", handleReset);
bot.command("keys", handleReset);

// Command: /clear
bot.command("clear", (ctx) => {
  const chatId = ctx.chat.id.toString();
  chatHistories.delete(chatId);
  return ctx.reply("🧹 Conversation history cleared! You can start a new request.");
});

// Command: /cancel
bot.command("cancel", (ctx) => {
  const chatId = ctx.chat.id.toString();
  userStates.delete(chatId);
  return ctx.reply("❌ Key input session cancelled.");
});

// Text message handler
bot.on("text", async (ctx) => {
  const text = ctx.message.text.trim();
  if (text.startsWith("/")) return; // Skip unmatched commands

  const chatId = ctx.chat.id.toString();
  const user = await getOrCreateTelegramUser(chatId);

  const activeState =
    userStates.get(chatId) || (!user.keeperhubKey ? "AWAITING_KEEPERHUB" : null);

  if (activeState === "AWAITING_KEEPERHUB") {
    const valMsg = await ctx.reply("⏳ Validating KeeperHub API Key...");
    const profile = await getKeeperHubUser(text);

    if (!profile) {
      await ctx.telegram.editMessageText(
        chatId,
        valMsg.message_id,
        undefined,
        "❌ Invalid KeeperHub API Key.\n\n" +
          "Could not fetch user profile from KeeperHub. Please verify your API Key at https://app.keeperhub.com -> Settings -> API Keys and try sending it again (or /cancel).",
      );
      return;
    }

    await updateTelegramUserKey(chatId, text);
    userStates.delete(chatId);

    await ctx.telegram.editMessageText(
      chatId,
      valMsg.message_id,
      undefined,
      "✅ KeeperHub API Key verified and saved! 🎉\n\n" +
        "⚙️ Setup is 100% complete! What would you like to do?\n" +
        "(e.g., 'Check my ETH balance on Sepolia')",
    );
    return;
  }

  // User is READY - execute AI Agent query
  if (!user.keeperhubKey) {
    userStates.set(chatId, "AWAITING_KEEPERHUB");
    return ctx.reply(
      "⚠️ KeeperHub API key is missing. Please send /start or reply with your KeeperHub API Key.",
    );
  }

  await ctx.sendChatAction("typing");
  const msg = await ctx.reply("⏳ Agent is thinking and executing...");

  try {
    // Multi-turn conversation history
    const history = chatHistories.get(chatId) || [];
    history.push(["human", text]);
    if (history.length > MAX_HISTORY_LENGTH) {
      history.splice(0, history.length - MAX_HISTORY_LENGTH);
    }

    const result = await withRetry(async () => {
      return await runAgentForUser(user.keeperhubKey!, history);
    });

    const lastMessage = result.messages[result.messages.length - 1];
    if (lastMessage && lastMessage.content) {
      const outputText = String(lastMessage.content);
      history.push(["ai", outputText]);
      chatHistories.set(chatId, history);

      const cleanText = formatTelegramText(outputText);
      const formatted = `✅ ${cleanText}`;

      if (formatted.length <= 4000) {
        await ctx.telegram.editMessageText(
          chatId,
          msg.message_id,
          undefined,
          formatted,
          { parse_mode: "Markdown" },
        );
      } else {
        // Split long responses across Telegram messages
        await ctx.telegram.editMessageText(
          chatId,
          msg.message_id,
          undefined,
          formatted.substring(0, 3900) + "\n\n(continued below...)",
          { parse_mode: "Markdown" },
        );
        for (let i = 3900; i < formatted.length; i += 3900) {
          await ctx.reply(formatted.substring(i, i + 3900), { parse_mode: "Markdown" });
        }
      }
    } else {
      await ctx.telegram.editMessageText(
        chatId,
        msg.message_id,
        undefined,
        "❌ No response received from agent.",
      );
    }
  } catch (error: any) {
    await ctx.telegram.editMessageText(
      chatId,
      msg.message_id,
      undefined,
      `❌ Error executing request: ${error.message}`,
    );
  }
});

// Global bot error handler
bot.catch((err: any, ctx: any) => {
  console.error(`Telegram Bot Error during ${ctx.updateType}:`, err);
});

async function launchWithRetry(maxAttempts: number = 5, delayMs: number = 3000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const me = await bot.telegram.getMe();
      console.log(`🤖 Centralized Telegram Bot (@${me.username}) is running...`);

      await bot.telegram
        .setMyCommands([
          { command: "start", description: "Start or check setup" },
          { command: "help", description: "Show usage help & available actions" },
          { command: "profile", description: "View profile & connected wallets" },
          { command: "reset", description: "Update KeeperHub API key" },
          { command: "clear", description: "Clear conversation history" },
          { command: "cancel", description: "Cancel key input prompt" },
        ])
        .catch((err) => console.warn("Failed to set bot commands:", err.message));

      await bot.launch();
      return;
    } catch (err: any) {
      console.warn(
        `⚠️ Telegram connection attempt ${attempt}/${maxAttempts} failed: ${err.message || err}`,
      );
      if (attempt < maxAttempts) {
        console.log(`⏳ Retrying in ${delayMs / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        console.error(
          "❌ Could not connect to Telegram API after multiple retries. Please check your network or proxy settings.",
        );
      }
    }
  }
}

launchWithRetry();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
