# KP: Zero-to-One KeeperHub Onchain AI Agent Platform 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![KeeperHub](https://img.shields.io/badge/KeeperHub-Execution_Layer-0AB955)](https://keeperhub.com)
[![Gemini](https://img.shields.io/badge/Gemini-Fallback_Engine-blue?logo=google)](https://ai.google.dev/)
[![Telegram Bot](https://img.shields.io/badge/Telegram_Bot-@keipee__bot-26A5E4?logo=telegram)](https://t.me/keipee_bot)

**KP** is a production-grade, zero-to-one starter platform and developer template for building AI agents that execute real onchain transactions using [KeeperHub](https://keeperhub.com) and [LangChain](https://js.langchain.com/).

Built for **The Last Mile — KeeperHub Agent Hackathon**, KP solves the execution reliability problem and targets the **Best Onboarding UX Improvement** bounty ($1,000) by taking developers and end users from zero to their first onchain transaction faster, smoother, and more reliably than ever before.

---

## 🏆 Hackathon Submission Summary

| Requirement | Status | Details |
|---|---|---|
| **KeeperHub Execution Layer** | ✅ Verified | Executes real transfers and contract interactions on 13+ EVM chains & Solana. |
| **Source Code Repository** | ✅ Public | Open Source Monorepo (`https://github.com/Kaycee276/kp`) |
| **Onchain Transaction Proof** | ✅ Verified | [0x6bdfd39b1666933e826a967e8bf3161c3bef7093ff72e909c0cfb6af9c04c4d3](https://sepolia.etherscan.io/tx/0x6bdfd39b1666933e826a967e8bf3161c3bef7093ff72e909c0cfb6af9c04c4d3) |
| **Multi-Surface Access** | ✅ CLI + Web + TG | Terminal CLI, Web Dashboard, and Centralized Telegram Bot ([@keipee_bot](https://t.me/keipee_bot)). |

---

## 🌟 Comprehensive Feature Matrix

### 📱 1. Centralized Telegram AI Bot (`@keipee_bot`)
- **1-Step Single-Key Onboarding**: Users only need to reply with their KeeperHub API key. The bot automatically manages LLM API keys server-side, keeping developer credentials 100% private.
- **Tap-to-Copy Wallet Address Pills**: All EVM (`0x...`) and Solana wallet addresses are rendered in monospaced code blocks. Tapping an address on mobile or desktop instantly copies it to the clipboard.
- **1-Tap Browser Links**: Explorer URLs, Markdown links, and 66-character transaction hashes are formatted as hyperlinked buttons that open in your browser with a single tap.
- **🔔 Real-Time Incoming Token Transfer Push Notifications**: Includes a background monitoring engine that periodically checks user wallets across EVM and Solana networks. When incoming tokens land, the bot pushes an instant Telegram alert showing amount, token symbol, network, and wallet address.
- **Resilient Database Fallback**: Implements PostgreSQL connection pooling with `dbRetry` and in-memory user caching, guaranteeing 100% uptime even if database queries drop.

### ⚡ 2. Dynamic Gemini Fallback & Infinite Wraparound Engine
- **Dynamic Model Discovery (`getAvailableGeminiModels`)**: Queries Google AI Studio on startup to list all available `generateContent` models (20+ models including `gemini-3.5-flash`, `gemini-3.6-flash`, `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-2.0-flash-lite`, etc.).
- **Sticky Model Tracking**: Remembers the last working model index across turns to minimize switching latency.
- **Infinite Wraparound Recovery**: If a model hits a `429 Too Many Requests` or quota exhaustion, KP automatically cascades to the next model. If all 20+ models fail in a single turn, it pauses 5 seconds for quota reset and wraps around infinitely—eliminating rate-limit crashes.
- **Gemini Schema Payload Wrapper**: KeeperHub tools use complex JSON schemas (`.nullish()` / `$ref`) designed for OpenAI. KP includes a `DynamicStructuredTool` wrapper that stringifies schema definitions, bypassing Gemini `400 Bad Request` schema errors.

### 🌐 3. Multi-Chain Execution Matrix (13+ EVM Chains + Solana)
- **EVM Mainnets & Testnets**: Ethereum Mainnet, Sepolia Testnet, Base Mainnet, Base Sepolia, Arbitrum One, Arbitrum Sepolia, Optimism, Optimism Sepolia, Polygon PoS, Polygon Amoy, Avalanche C-Chain, BNB Smart Chain (BSC), Fantom Opera.
- **Solana**: Solana Mainnet-Beta, Solana Devnet.
- **Strict Read vs Write Scoping**: Information-only queries (balances, profile lookups) execute automatically; spend/write operations (transfers, contract executions) strictly enforce `Proceed? (y/N)` confirmation prompts.

### 🍎 4. Apple-Grade Web Interface & Interactive Playground
- **Design System (`Apple_design_skill.md`)**: Dark obsidian theme (`#0a0a0c`), translucent glassmorphism (`backdrop-filter: blur(25px)`), optical typography (SF Pro / Inter), catch-light borders (`border-top: 1px solid rgba(255,255,255,0.16)`), and spring press feedback (`:active { scale: 0.97 }`).
- **Interactive Web Terminal Sandbox (`TerminalPlayground.tsx`)**: In-browser interactive CLI simulator with Mac window controls (red/yellow/green glass dots), preset command chips, real-time response simulation, and monospaced tap-to-copy address pills.
- **OAuth Device Pairing Flow (`/link`)**: Pair CLI terminal instances with the Web Dashboard vault using 6-character device codes.
- **Encrypted API Vault**: Manage KeeperHub and Gemini API keys with password visibility toggles and live validation status badges.

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
       │                   Vault Encrypted API Key Management                    │
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
                                            │
                                            ▼
       ┌─────────────────────────────────────────────────────────────────────────┐
       │             Real-Time Telegram Push Transfer Monitor                    │
       │        Instant Alerts for Incoming Tokens on EVM & Solana               │
       └─────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Prerequisites

- Node.js (v18+)
- A KeeperHub API Key ([app.keeperhub.com](https://app.keeperhub.com) -> Settings -> API Keys)
- A Gemini API Key (Free from [Google AI Studio](https://aistudio.google.com/app/apikey))

---

## 🚀 Quick Start

### 1. Install CLI Globally

**Mac/Linux:**
```bash
curl -fsSL https://kp-three-mu.vercel.app/install.sh | bash
```

**Windows (PowerShell):**
```powershell
iwr https://kp-three-mu.vercel.app/install.ps1 -useb | iex
```

### 2. Run the Agent
```bash
kp
```

### 3. Authorize Device
The CLI will generate a 6-character device code and open your browser to the Web Dashboard to sign in with GitHub, save your API keys, and click **Authorize Device**.

### 4. Or Chat on Telegram
Search for **[@keipee_bot](https://t.me/keipee_bot)** on Telegram, send `/start`, and reply with your KeeperHub API key to start transacting!

---

## 🏆 Proof of Onchain Execution

* **Agent Name:** KP Onchain AI Agent
* **Execution Layer:** KeeperHub
* **Network:** Sepolia Testnet
* **Action:** Transfer native ETH via KeeperHub Toolkit
* **Transaction Hash:** [`0x6bdfd39b1666933e826a967e8bf3161c3bef7093ff72e909c0cfb6af9c04c4d3`](https://sepolia.etherscan.io/tx/0x6bdfd39b1666933e826a967e8bf3161c3bef7093ff72e909c0cfb6af9c04c4d3)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
