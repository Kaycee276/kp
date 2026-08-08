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
  arbitrum,
  optimism,
  polygon,
  sepolia,
} from "viem/chains";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

dotenv.config();
dotenv.config({ path: "./web/.env" });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
  console.error("❌ TELEGRAM_BOT_TOKEN environment variable is not set in .env!");
  process.exit(1);
}
const bot = new Telegraf(botToken);

const evmChains: Record<string, any> = {
  ethereum: mainnet,
  base,
  arbitrum,
  optimism,
  polygon,
  sepolia,
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

// Mask API key for profile view
function maskKey(key: string | null | undefined): string {
  if (!key) return "Not set";
  if (key.length <= 8) return "••••••••";
  return `${key.substring(0, 4)}••••${key.substring(key.length - 4)}`;
}

// In-memory conversation history per chat ID
const chatHistories = new Map<string, Array<[string, string]>>();
const MAX_HISTORY_LENGTH = 10;

// State machine for onboarding input steps
const userStates = new Map<string, "AWAITING_GEMINI" | "AWAITING_KEEPERHUB">();

async function createAgentForUser(geminiKey: string, keeperhubKey: string) {
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-3.5-flash",
    temperature: 0,
    apiKey: geminiKey,
  });

  const toolkit = new KeeperGateToolkit({ apiKey: keeperhubKey });
  const tools = await toolkit.getTools();

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
    "You are KP, a helpful AI assistant that can execute onchain transactions using KeeperHub. Always explain what you are going to do before executing a transaction.";

  if (evmWalletAddress) {
    systemPrompt += `\n\nThe user's KeeperHub EVM wallet address is ${evmWalletAddress}. If they ask to check their EVM balance or perform an EVM action without specifying an address, use this address.`;
  }

  if (solanaWalletAddress) {
    systemPrompt += `\n\nThe user's KeeperHub Solana wallet address is ${solanaWalletAddress}. If they ask to check their Solana balance or perform a Solana action without specifying an address, use this address.`;
  }

  return createAgent({
    model,
    tools: geminiCompatibleTools as any,
    systemPrompt,
  });
}

// Command: /start
bot.start(async (ctx) => {
  const chatId = ctx.chat.id.toString();
  let user = await prisma.telegramUser.findUnique({ where: { chatId } });

  if (!user) {
    user = await prisma.telegramUser.create({ data: { chatId } });
  }

  if (user.geminiKey && user.keeperhubKey) {
    return ctx.reply(
      "🤖 Welcome back to KP Onchain AI Agent!\n\n" +
        "Your API keys are configured and ready. You can ask me to check balances or run transactions.\n\n" +
        "• /profile - View setup & wallet addresses\n" +
        "• /reset - Update your API keys\n" +
        "• /clear - Reset conversation memory\n" +
        "• /help - View commands and help",
    );
  }

  userStates.set(chatId, "AWAITING_GEMINI");
  return ctx.reply(
    "👋 Welcome to KP Onchain AI Agent!\n\n" +
      "Let's get you set up in two quick steps.\n\n" +
      "1️⃣ Please reply with your **Gemini API Key**.\n" +
      "_(Get a free key from Google AI Studio at https://aistudio.google.com/app/apikey)_\n\n" +
      "Send /cancel anytime to abort.",
    { parse_mode: "Markdown" },
  );
});

// Command: /help
bot.command("help", (ctx) => {
  return ctx.reply(
    "🤖 **KP Onchain AI Agent Help**\n\n" +
      "KP allows you to query balances and execute onchain transactions directly from Telegram using Gemini AI and KeeperHub.\n\n" +
      "**Available Actions:**\n" +
      "• Check EVM balances (Ethereum, Base, Arbitrum, Optimism, Polygon, Sepolia)\n" +
      "• Check Solana balances (Mainnet, Devnet)\n" +
      "• Execute transfers, contract interactions & automation via KeeperHub\n\n" +
      "**Bot Commands:**\n" +
      "• /profile - Check connected wallets & API key status\n" +
      "• /reset - Update Gemini & KeeperHub API keys\n" +
      "• /clear - Clear chat conversation memory\n" +
      "• /cancel - Cancel active key input prompt\n" +
      "• /help - Show this message",
    { parse_mode: "Markdown" },
  );
});

// Command: /profile or /status
const handleProfile = async (ctx: any) => {
  const chatId = ctx.chat.id.toString();
  const user = await prisma.telegramUser.findUnique({ where: { chatId } });

  if (!user || (!user.geminiKey && !user.keeperhubKey)) {
    return ctx.reply(
      "⚠️ You haven't configured your API keys yet. Send /start to begin setup.",
    );
  }

  const statusMsg = await ctx.reply("⏳ Fetching wallet profile...");
  const keeperProfile = user.keeperhubKey
    ? await getKeeperHubUser(user.keeperhubKey)
    : null;

  const msg =
    "👤 **KP User Profile**\n\n" +
    `• **Gemini Key:** \`${maskKey(user.geminiKey)}\`\n` +
    `• **KeeperHub Key:** \`${maskKey(user.keeperhubKey)}\`\n\n` +
    "💳 **Connected KeeperHub Wallets:**\n" +
    `• **EVM Address:** \`${keeperProfile?.walletAddress || "Not connected / Invalid key"}\`\n` +
    `• **Solana Address:** \`${keeperProfile?.solanaWalletAddress || "Not connected / Invalid key"}\``;

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
  userStates.set(chatId, "AWAITING_GEMINI");
  return ctx.reply(
    "🔄 **Resetting API Keys**\n\n" +
      "1️⃣ Please reply with your new **Gemini API Key**.\n" +
      "Send /cancel to abort.",
    { parse_mode: "Markdown" },
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

  let user = await prisma.telegramUser.findUnique({ where: { chatId } });
  if (!user) {
    user = await prisma.telegramUser.create({ data: { chatId } });
  }

  const activeState =
    userStates.get(chatId) ||
    (!user.geminiKey
      ? "AWAITING_GEMINI"
      : !user.keeperhubKey
        ? "AWAITING_KEEPERHUB"
        : null);

  if (activeState === "AWAITING_GEMINI") {
    const valMsg = await ctx.reply("⏳ Validating Gemini API Key...");
    const isValid = await validateGeminiKey(text);

    if (!isValid) {
      await ctx.telegram.editMessageText(
        chatId,
        valMsg.message_id,
        undefined,
        "❌ **Invalid Gemini API Key.**\n\n" +
          "Could not authenticate with Gemini. Please verify your key at https://aistudio.google.com/app/apikey and try sending it again (or /cancel).",
        { parse_mode: "Markdown" },
      );
      return;
    }

    await prisma.telegramUser.update({
      where: { chatId },
      data: { geminiKey: text },
    });
    userStates.set(chatId, "AWAITING_KEEPERHUB");

    await ctx.telegram.editMessageText(
      chatId,
      valMsg.message_id,
      undefined,
      "✅ **Gemini API Key verified and saved!** 🎉\n\n" +
        "2️⃣ Now, please reply with your **KeeperHub API Key**.\n" +
        "_(Get your API key at https://app.keeperhub.com -> Settings -> API Keys)_",
      { parse_mode: "Markdown" },
    );
    return;
  }

  if (activeState === "AWAITING_KEEPERHUB") {
    const valMsg = await ctx.reply("⏳ Validating KeeperHub API Key...");
    const profile = await getKeeperHubUser(text);

    if (!profile) {
      await ctx.telegram.editMessageText(
        chatId,
        valMsg.message_id,
        undefined,
        "❌ **Invalid KeeperHub API Key.**\n\n" +
          "Could not fetch user profile from KeeperHub. Please verify your API Key at https://app.keeperhub.com and try sending it again (or /cancel).",
        { parse_mode: "Markdown" },
      );
      return;
    }

    await prisma.telegramUser.update({
      where: { chatId },
      data: { keeperhubKey: text },
    });
    userStates.delete(chatId);

    await ctx.telegram.editMessageText(
      chatId,
      valMsg.message_id,
      undefined,
      "✅ **KeeperHub API Key verified and saved!** 🎉\n\n" +
        "⚙️ Setup is 100% complete! What would you like to do?\n" +
        "_(e.g., 'Check my ETH balance on Sepolia')_",
      { parse_mode: "Markdown" },
    );
    return;
  }

  // User is READY - execute AI Agent query
  if (!user.geminiKey || !user.keeperhubKey) {
    userStates.set(chatId, "AWAITING_GEMINI");
    return ctx.reply(
      "⚠️ API keys are missing. Please send /start or reply with your **Gemini API Key**.",
      { parse_mode: "Markdown" },
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

    const agent = await createAgentForUser(user.geminiKey, user.keeperhubKey);

    const result = await withRetry(async () => {
      return await agent.invoke({ messages: history });
    });

    const lastMessage = result.messages[result.messages.length - 1];
    if (lastMessage && lastMessage.content) {
      const outputText = String(lastMessage.content);
      history.push(["ai", outputText]);
      chatHistories.set(chatId, history);

      const formatted = `✅ ${outputText}`;

      if (formatted.length <= 4000) {
        await ctx.telegram.editMessageText(
          chatId,
          msg.message_id,
          undefined,
          formatted,
        );
      } else {
        // Split long responses across Telegram messages
        await ctx.telegram.editMessageText(
          chatId,
          msg.message_id,
          undefined,
          formatted.substring(0, 3900) + "\n\n*(continued below...)*",
        );
        for (let i = 3900; i < formatted.length; i += 3900) {
          await ctx.reply(formatted.substring(i, i + 3900));
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

// Set command menu for Telegram UI
bot.telegram
  .setMyCommands([
    { command: "start", description: "Start or check setup" },
    { command: "help", description: "Show usage help & available actions" },
    { command: "profile", description: "View profile & connected wallets" },
    { command: "reset", description: "Update Gemini & KeeperHub API keys" },
    { command: "clear", description: "Clear conversation history" },
    { command: "cancel", description: "Cancel key input prompt" },
  ])
  .catch((err) => console.warn("Failed to set bot commands:", err.message));

// Global bot error handler
bot.catch((err: any, ctx: any) => {
  console.error(`Telegram Bot Error during ${ctx.updateType}:`, err);
});

console.log("🤖 Centralized Telegram Bot is running...");
bot.launch().catch((err) => {
  console.error("❌ Failed to launch Telegram bot:", err.message);
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
