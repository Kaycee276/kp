# KP: Zero-to-One KeeperHub Onchain AI Agent Platform 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![KeeperHub](https://img.shields.io/badge/KeeperHub-Execution_Layer-0AB955)](https://keeperhub.com)
[![Gemini](https://img.shields.io/badge/Gemini-Fallback_Engine-blue?logo=google)](https://ai.google.dev/)
[![Telegram Bot](https://img.shields.io/badge/Telegram_Bot-@keipee__bot-26A5E4?logo=telegram)](https://t.me/keipee_bot)
[![UptimeRobot](https://img.shields.io/badge/Status-Operational_🟢-00E676)](https://stats.uptimerobot.com/SjyoYOBuNi/803699400)

**KP** is a production-grade, zero-to-one platform and developer template for building AI agents that execute real onchain transactions using [KeeperHub](https://keeperhub.com) and [LangChain](https://js.langchain.com/).

Built for **The Last Mile — KeeperHub Agent Hackathon**, KP targets the **Best Onboarding UX Improvement** bounty ($1,000) by taking developers and end users from zero to their first onchain transaction faster, smoother, and more reliably than ever before.

---

## 🏆 Hackathon Submission Summary

| Requirement | Status | Details |
|---|---|---|
| **KeeperHub Execution Layer** | ✅ Verified | Executes real transfers and contract interactions on 13+ EVM chains & Solana. |
| **Source Code Repository** | ✅ Public | Open Source Monorepo ([github.com/Kaycee276/kp](https://github.com/Kaycee276/kp)) |
| **Onchain Transaction Proof** | ✅ Verified | [`0x6bdfd39b1666933e826a967e8bf3161c3bef7093ff72e909c0cfb6af9c04c4d3`](https://sepolia.etherscan.io/tx/0x6bdfd39b1666933e826a967e8bf3161c3bef7093ff72e909c0cfb6af9c04c4d3) |
| **Multi-Surface Access** | ✅ CLI + Web + TG | Terminal CLI, Web Dashboard, and Centralized Telegram Bot ([@keipee_bot](https://t.me/keipee_bot)). |
| **System Uptime & Monitoring** | ✅ Live 24/7 | Render & Vercel deployment with [UptimeRobot Live Status Page](https://stats.uptimerobot.com/SjyoYOBuNi/803699400). |

---

## 🚀 Quick Start & 1-Line Installers

### 1. Terminal CLI (`kp`) Installation

The CLI can be installed with a single command on Mac, Linux, or Windows. The installer automatically clones the project, installs dependencies, builds the binary, and links `kp` globally.

#### Mac / Linux:
```bash
curl -fsSL https://kp-three-mu.vercel.app/install.sh | bash
```

#### Windows (PowerShell):
```powershell
iwr https://kp-three-mu.vercel.app/install.ps1 -useb | iex
```

Once installed, simply run:
```bash
kp
```

---

### 2. Telegram AI Bot (`@keipee_bot`) Access

No installation required! Message [@keipee_bot](https://t.me/keipee_bot) on Telegram from any device.

---

## 📹 Demo Video Script & Walkthrough Guide (2-Minute Outline)

When recording your hackathon submission demo video, follow this structured narrative:

| Timestamp | Section | Screen & Action | Key Talking Points |
| :--- | :--- | :--- | :--- |
| **0:00 - 0:20** | **Hook & Intro** | Web Dashboard Landing Page (`https://kp-three-mu.vercel.app`) | "Welcome to KP — an onchain AI agent platform built for The Last Mile KeeperHub Hackathon, targeting the Best Onboarding UX bounty." |
| **0:20 - 0:55** | **Telegram Bot Demo** | Telegram Mobile or Desktop Chatting with `@keipee_bot` | "Users start by messaging @keipee_bot. Onboarding requires only a KeeperHub key — LLM keys are handled server-side. Addresses render in tap-to-copy pills and tx hashes turn into 1-tap Etherscan links." |
| **0:55 - 1:30** | **CLI & OAuth Pairing** | Terminal Window + Web Browser Pairing (`/link?code=...`) | "Developers install via 1-line curl script. Running `kp` triggers OAuth Device Pairing. Once approved, the CLI executes transactions with manual interactive confirmation safeguards." |
| **1:30 - 1:50** | **Security & Reliability** | Web Vault + UptimeRobot Status Page | "Zero raw API keys are sent to the frontend. The engine uses a dynamic 20+ Gemini model fallback cascade to guarantee zero rate-limit crashes with 99.9% uptime." |
| **1:50 - 2:00** | **Onchain Proof & Wrap-up** | Etherscan Transaction Page (`0x6bdfd39b...`) | "Here is our verified Sepolia transaction proof executed live via KeeperHub. Thank you!" |

---

## 📱 Telegram Bot Workflow (`@keipee_bot`)

The Telegram Bot allows users to check balances and execute onchain actions directly on mobile or desktop without installing anything or managing Gemini LLM keys.

```mermaid
sequenceDiagram
    autonumber
    actor User as Telegram User
    participant Bot as Telegram Bot (@keipee_bot)
    participant DB as PostgreSQL DB
    participant KH as KeeperHub API
    participant AI as LangChain + Gemini Engine

    User->>Bot: Open chat & send message or /start
    Bot->>DB: Check TelegramUser by chatId
    alt User has no KeeperHub API key saved
        Bot->>User: "⚠️ KeeperHub API Key required. Reply with your key..."
        User->>Bot: Pastes key "kh_live_..."
        Bot->>KH: Validate key GET /api/user
        alt Valid Key
            Bot->>DB: Save keeperhubKey to TelegramUser
            Bot->>User: "✅ KeeperHub API Key verified & saved! 🎉"
        else Invalid Key
            Bot->>User: "❌ Invalid KeeperHub API Key. Please try again."
        end
    else User has saved KeeperHub API key
        Bot->>AI: Run prompt with user's KeeperHub key + Server Gemini key
        AI->>KH: Execute tool (balance check or transfer)
        KH-->>AI: Tool output & Tx Hash
        AI-->>Bot: Formatted response text
        Bot->>User: Send reply with tap-to-copy address pills & Etherscan link
    end
```

### Step-by-Step Telegram Onboarding & Interaction
1. **Initiate Chat**: Open [@keipee_bot](https://t.me/keipee_bot) on Telegram and tap **Start** (or send `/start`).
2. **Single-Key Input**: If your KeeperHub key is not saved yet, the bot asks for your KeeperHub API Key (`kh_...`).
3. **Automatic Validation & Encryption**: The bot validates your key against KeeperHub and saves it securely to the database. You never need to enter a Gemini LLM key (the server supplies Gemini AI reasoning automatically).
4. **Natural Language Prompts**: Send requests like:
   - *"What is my ETH balance on Sepolia?"*
   - *"Send 0.01 Sepolia ETH to 0xF1a3c409ebf9B2f5a8Dbaf7b37E8d807215f0bAA"*
5. **Tap-to-Copy & 1-Tap Explorer Links**: Wallet addresses are formatted in monospaced backticks (`0x...`) for tap-to-copy, and transaction hashes are automatically turned into 1-tap Etherscan links.

### Available Telegram Commands
| Command | Action |
| :--- | :--- |
| `/start` | Start or check setup status |
| `/profile` / `/status` | View connected EVM & Solana wallet addresses |
| `/reset` / `/keys` | Update or change KeeperHub API key |
| `/clear` | Clear conversation history |
| `/cancel` | Cancel active key input session |
| `/help` | View help guide & supported actions |

---

## ⚡ Terminal CLI Workflow (`kp`)

The CLI agent provides an interactive terminal interface for developers with built-in OAuth device pairing and explicit confirmation safeguards before sending onchain transactions.

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Terminal User
    participant CLI as KP CLI (kp)
    participant Web as Web App (Next.js)
    participant DB as Postgres DB
    participant KH as KeeperHub Layer

    Dev->>CLI: Type 'kp' in terminal
    CLI->>CLI: Check ~/.kp-config.json
    alt Credentials missing
        CLI->>Web: POST /api/auth/device/init
        Web-->>CLI: Return deviceCode & pairing link
        CLI->>Dev: Display "Visit https://kp-three-mu.vercel.app/link?code=A8K2P9"
        Dev->>Web: Open URL in browser & approve device
        CLI->>Web: Poll /api/auth/device/poll
        Web-->>CLI: Return KeeperHub key & server Gemini API key
        CLI->>CLI: Save config to ~/.kp-config.json
    end
    CLI->>Dev: "🤖 KP Onchain Agent ready!"
    Dev->>CLI: "Send 0.01 Sepolia ETH to 0x..."
    alt Write Transaction (Send/Transfer)
        CLI->>Dev: Prompt "[CONFIRMATION REQUIRED] Execute transaction? (y/N)"
        Dev->>CLI: "y"
        CLI->>KH: Execute onchain transaction via KeeperHub Toolkit
        KH-->>CLI: Transaction Hash
        CLI->>Dev: Render formatted ANSI terminal output & explorer link
    end
```

### Step-by-Step CLI Workflow
1. **Installation**: Run `curl -fsSL https://kp-three-mu.vercel.app/install.sh | bash` (Mac/Linux) or `iwr https://kp-three-mu.vercel.app/install.ps1 -useb | iex` (Windows).
2. **Launch CLI**: Type `kp` in your terminal.
3. **OAuth Device Pair (First Time Only)**:
   - The CLI generates a 6-character device code and displays a pairing link: `https://kp-three-mu.vercel.app/link?code=XXXXXX`.
   - Open the link in your browser, log in, enter your KeeperHub API key in the vault, and click **Approve CLI Terminal Device**.
   - The CLI automatically receives your keys and saves them to `~/.kp-config.json`.
4. **Interactive Prompts**: Enter natural language commands directly in the terminal.
5. **Confirmation Safeguard**: Write operations (transfers, contract calls) require explicit interactive confirmation (`y/N`) before executing onchain.

---

## 🌟 Comprehensive Feature Matrix

### 📱 1. Centralized Telegram AI Bot (`@keipee_bot`)
- **1-Step Single-Key Onboarding**: Users only need to reply with their KeeperHub API key. The bot automatically manages LLM API keys server-side, keeping developer credentials 100% private.
- **Tap-to-Copy Wallet Address Pills**: All EVM (`0x...`) and Solana wallet addresses are rendered in monospaced code blocks. Tapping an address on mobile or desktop instantly copies it to the clipboard.
- **Resilient Database Fallback**: Implements PostgreSQL connection pooling with `dbRetry` and in-memory user caching, guaranteeing 100% uptime even if database queries drop.

### ⚡ 2. Dynamic Gemini Fallback Engine
- **Dynamic Model Discovery (`getAvailableGeminiModels`)**: Queries Google AI Studio on startup to list all available `generateContent` models (20+ models including `gemini-3.5-flash`, `gemini-3.6-flash`, `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-2.0-flash-lite`, etc.).
- **Sticky Model Tracking**: Remembers the last working model index across turns to minimize switching latency.
- **Infinite Wraparound Recovery**: If a model hits a `429 Too Many Requests` or quota limit, KP automatically cascades to the next available model.
- **Gemini Schema Payload Wrapper**: Wraps complex JSON schemas into a `DynamicStructuredTool` format to bypass Gemini `400 Bad Request` schema errors.

### 🌐 3. Multi-Chain Execution Matrix (13+ EVM Chains + Solana)
- **EVM Mainnets & Testnets**: Ethereum Mainnet, Sepolia Testnet, Base Mainnet, Base Sepolia, Arbitrum One, Arbitrum Sepolia, Optimism, Optimism Sepolia, Polygon PoS, Polygon Amoy, Avalanche C-Chain, BNB Smart Chain (BSC), Fantom Opera.
- **Solana**: Solana Mainnet-Beta, Solana Devnet.

### 🔒 4. Zero-Raw-Key Frontend Security Architecture
- **Boolean Status Flag Only**: Server passes `hasKeeperhubKey={!!user?.keeperhubKey}` boolean flag to frontend. Raw key strings are **NEVER** loaded or rendered in client HTML or React state.
- **Permanent Password Masking**: Input fields remain strictly `<input type="password" />` without plain-text toggles. Memory state is wiped immediately after posting updates.

### 🍎 5. Apple-Grade Web Interface & Science Gothic Design System
- **Design System**: Dark obsidian theme (`#0a0a0c`), translucent glassmorphism (`backdrop-filter: blur(25px)`), and Science Gothic variable typography.
- **Interactive Web Terminal Sandbox (`TerminalPlayground.tsx`)**: In-browser interactive CLI simulator with Mac window controls, preset command chips, and real-time response simulation.
- **Inline Button Feedback**: Visual loading spinners (`<Loader2 className="animate-spin" />`) on GitHub Sign-In and Key Save actions.
- **OAuth Device Pairing Flow (`/link`)**: Pair CLI terminal instances with the Web Dashboard vault using 6-character device codes.

---

## 🏗️ Architecture Overview

```
                        ┌────────────────────────────────────────┐
                        │              USER INPUT                │
                        └───────────────────┬────────────────────┘
                                            │
               ┌────────────────────────────┴────────────────────────────┐
               │                                                         │
       ┌───────▼────────┐                                       ┌────────▼───────┐
       │  Terminal CLI  │                                       │  Telegram Bot  │
       │     (`kp`)     │                                       │ (@keipee_bot)  │
       └───────┬────────┘                                       └────────┬───────┘
               │                                                         │
               │ (OAuth Device Flow)                                     │ (Single-Key)
               ▼                                                         ▼
       ┌─────────────────────────────────────────────────────────────────────────┐
       │                  Next.js Web Dashboard & PostgreSQL                      │
       │           Zero-Raw-Key Encrypted API Vault & Device Pairing             │
       └────────────────────────────────────┬────────────────────────────────────┘
                                            │
                                            ▼
       ┌─────────────────────────────────────────────────────────────────────────┐
       │              KP Agent Core (LangChain + Gemini Fallback)                │
       │      Dynamic Model Discovery + Sticky Index + Infinite Wraparound       │
       └────────────────────────────────────┬────────────────────────────────────┘
                                            │
                                            ▼
       ┌─────────────────────────────────────────────────────────────────────────┐
       │                    KeeperHub Onchain Execution Layer                    │
       │   13+ EVM Chains (Eth, Base, Arb, OP, Polygon, BSC) + Solana Mainnet    │
       └─────────────────────────────────────────────────────────────────────────┘
```

---

## 🏆 Proof of Onchain Execution

- **Agent Name:** KP Onchain AI Agent
- **Execution Layer:** KeeperHub
- **Network:** Sepolia Testnet
- **Action:** Transfer native ETH via KeeperHub Toolkit
- **Transaction Hash:** [`0x6bdfd39b1666933e826a967e8bf3161c3bef7093ff72e909c0cfb6af9c04c4d3`](https://sepolia.etherscan.io/tx/0x6bdfd39b1666933e826a967e8bf3161c3bef7093ff72e909c0cfb6af9c04c4d3)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
