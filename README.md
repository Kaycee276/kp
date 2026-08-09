# KP: Zero-to-One KeeperHub Onchain AI Agent Platform 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![KeeperHub](https://img.shields.io/badge/KeeperHub-Execution_Layer-0AB955)](https://keeperhub.com)
[![Gemini](https://img.shields.io/badge/Gemini-Fallback_Engine-blue?logo=google)](https://ai.google.dev/)
[![Telegram Bot](https://img.shields.io/badge/Telegram_Bot-@keipee__bot-26A5E4?logo=telegram)](https://t.me/keipee_bot)

**KP** is a production-grade, zero-to-one starter platform and template for building AI agents that execute real onchain transactions using [KeeperHub](https://keeperhub.com) and [LangChain](https://js.langchain.com/).

Built for **The Last Mile — KeeperHub Agent Hackathon**, KP solves the execution reliability problem and targets the **Best Onboarding UX Improvement** bounty ($1,000) by taking developers from zero to their first onchain transaction faster and smoother than ever before.

---

## 🏆 Hackathon Submission Checklist

| Requirement | Status | Details |
|---|---|---|
| **KeeperHub Execution Layer** | ✅ Verified | Executes real transfers and contract interactions on 13+ EVM chains & Solana. |
| **Source Code Repository** | ✅ Public | GitHub Monorepo (`https://github.com/Kaycee276/kp`) |
| **Onchain Transaction Proof** | ✅ Verified | [0x6bdfd39b1666933e826a967e8bf3161c3bef7093ff72e909c0cfb6af9c04c4d3](https://sepolia.etherscan.io/tx/0x6bdfd39b1666933e826a967e8bf3161c3bef7093ff72e909c0cfb6af9c04c4d3) |
| **Multi-Surface Access** | ✅ CLI + Web + TG | Terminal CLI, Web Dashboard, and Centralized Telegram Bot ([@keipee_bot](https://t.me/keipee_bot)). |

---

## 🌟 Key Features & Innovations

### 1. 📱 Centralized Telegram AI Bot (`@keipee_bot`)
* **1-Step Single Key Onboarding**: Telegram users only provide their KeeperHub API key. Server automatically injects the centralized Gemini key, keeping server credentials 100% private.
* **Tap-to-Copy Wallet Address Pills**: Wallet addresses in responses are automatically formatted as monospaced inline code pills. Tapping an address on mobile or desktop instantly copies it to clipboard!
* **Clean Plain Text Formatting**: Telegram responses are cleaned of markdown noise, keeping responses concise and readable.

### 2. ⚡ Dynamic Gemini Fallback & Wraparound Loop
* **Dynamic Model Discovery (`getAvailableGeminiModels`)**: Dynamically queries Google AI Studio API on startup to list all available `generateContent` models (over 20+ models including `gemini-3.5-flash`, `gemini-3.6-flash`, `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-2.0-flash-lite`, etc.).
* **Sticky Working Model**: Once a model succeeds, KP remains on that model for all subsequent queries.
* **Infinite Wraparound Recovery**: If a model hits a `429 Too Many Requests` or quota limit, KP automatically switches to the next model. If all 20+ models are exhausted in a single turn, it pauses 5 seconds for quota reset and wraps around to the beginning, ensuring **zero 429 crash failures**.

### 3. 🌐 Multi-Chain Support (13+ EVM Chains + Solana)
* **EVM Mainnets & Testnets**: Ethereum Mainnet, Sepolia, Base Mainnet, Base Sepolia, Arbitrum One, Arbitrum Sepolia, Optimism, Optimism Sepolia, Polygon PoS, Polygon Amoy, Avalanche C-Chain, BNB Smart Chain (BSC), Fantom.
* **Solana**: Solana Mainnet-Beta, Solana Devnet.

### 4. 🍎 Apple-Grade Web Interface & Interactive Playground
* Built following **Apple Design Principles** (`web/Apple_design_skill.md`): backdrop-filter frosted glass (`blur(25px)`), optical type sizing, spring active press states (`:active { scale: 0.97 }`), and an interactive in-browser **Terminal Sandbox**.

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
       │                     KeeperHub Onchain Execution Layer                   │
       │   13+ EVM Chains (Eth, Base, Arb, OP, Polygon, BSC) + Solana Mainnet    │
       └─────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Prerequisites

- Node.js (v18+)
- KeeperHub API Key ([app.keeperhub.com](https://app.keeperhub.com) -> Settings -> API Keys)
- Gemini API Key (Free from [Google AI Studio](https://aistudio.google.com/app/apikey))

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
The CLI will generate a secure 6-character device code and direct you to the Web Dashboard to sign in with GitHub, save your API keys, and click **Authorize Device**.

### 4. Or Chat on Telegram
Search for **[@keipee_bot](https://t.me/keipee_bot)** on Telegram, send `/start`, and reply with your KeeperHub API key!

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
