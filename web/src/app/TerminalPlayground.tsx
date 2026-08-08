"use client";

import { useState } from "react";
import { Send, Check, Copy, RefreshCw } from "lucide-react";

interface CommandPreset {
  label: string;
  command: string;
  response: string;
}

const PRESETS: CommandPreset[] = [
  {
    label: "Sepolia Balance",
    command: "Check my wallet balance on Sepolia testnet",
    response:
      "The native balance of `0xc23a9dab14421b8dbdc871a1dcb78d801a6e4766` on Sepolia is **0.007 ETH**.",
  },
  {
    label: "Solana Devnet",
    command: "What is my SOL balance on Solana devnet?",
    response:
      "The SOL balance of `3aN8kP...SolanaAddress` on Solana devnet is **1.45 SOL**.",
  },
  {
    label: "Transfer Execution",
    command: "Transfer 0.001 ETH to 0x71C... on Sepolia",
    response:
      "Executing transfer via KeeperHub...\n\nTransaction Submitted: `0xa4f28919b5b29...`\nStatus: Verified on Sepolia Etherscan.",
  },
  {
    label: "Telegram Agent",
    command: "Connect my KeeperHub API key to Telegram bot",
    response:
      "Telegram Bot (@keipee_bot) is active! Send `/start` on Telegram to run onchain commands seamlessly on mobile.",
  },
];

export default function TerminalPlayground() {
  const [activePreset, setActivePreset] = useState<number>(0);
  const [input, setInput] = useState<string>(PRESETS[0].command);
  const [output, setOutput] = useState<string>(PRESETS[0].response);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);

  const handleRunPreset = (index: number) => {
    setActivePreset(index);
    setInput(PRESETS[index].command);
    setIsExecuting(true);
    setTimeout(() => {
      setOutput(PRESETS[index].response);
      setIsExecuting(false);
    }, 400);
  };

  const handleCustomRun = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isExecuting) return;
    setIsExecuting(true);
    setTimeout(() => {
      if (input.toLowerCase().includes("solana")) {
        setOutput(
          "The SOL balance of `3aN8kP9zLq2XwRt7uYvMmB1vC4xZ9aKs` on Solana mainnet is **2.85 SOL**.",
        );
      } else if (input.toLowerCase().includes("base")) {
        setOutput(
          "The balance of `0xc23a9dab14421b8dbdc871a1dcb78d801a6e4766` on Base is **0.042 ETH**.",
        );
      } else {
        setOutput(
          `Agent executed query: "${input}"\n\nResult for wallet \`0xc23a9dab14421b8dbdc871a1dcb78d801a6e4766\`: Operation verified onchain.`,
        );
      }
      setIsExecuting(false);
    }, 500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddr(text);
    setTimeout(() => setCopiedAddr(null), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto apple-glass-card rounded-2xl overflow-hidden shadow-2xl border border-white/10 my-12">
      {/* Apple Window Bar */}
      <div className="px-5 py-3.5 bg-white/5 border-b border-white/10 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/50" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/50" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]/50" />
          <span className="ml-3 text-xs font-medium text-white/50 font-mono">
            kp-agent — zsh — 80x24
          </span>
        </div>
      </div>

      {/* Preset Command Chips */}
      <div className="px-5 py-3 bg-black/40 border-b border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-xs font-semibold text-white/40 uppercase tracking-wider mr-1 shrink-0">
          Try Command:
        </span>
        {PRESETS.map((preset, idx) => (
          <button
            key={preset.label}
            onClick={() => handleRunPreset(idx)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all apple-button shrink-0 border ${
              activePreset === idx
                ? "bg-[#0ab955]/20 text-emerald-300 border-[#0ab955]/40 shadow-sm shadow-[#0ab955]/10"
                : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Terminal Viewport */}
      <div className="p-6 font-mono text-sm min-h-[220px] bg-black/60 text-white/90 space-y-4">
        {/* User Prompt Entry */}
        <div className="flex items-start gap-3 text-emerald-400 font-semibold">
          <span className="text-white/40 shrink-0">kp &gt;</span>
          <span className="text-white font-medium">{input}</span>
        </div>

        {/* Output Output Box */}
        <div className="pl-6 border-l-2 border-emerald-500/40 space-y-2">
          {isExecuting ? (
            <div className="flex items-center gap-2 text-white/60 animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Agent is thinking and querying KeeperHub...</span>
            </div>
          ) : (
            <div className="text-white/80 leading-relaxed whitespace-pre-line font-sans text-sm">
              {output.split("`").map((part, i) => {
                if (i % 2 === 1) {
                  // Monospaced tap-to-copy address pill
                  const isCopied = copiedAddr === part;
                  return (
                    <button
                      key={part}
                      onClick={() => copyToClipboard(part)}
                      className="inline-flex items-center gap-1 font-mono text-xs bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 transition-all mx-1 apple-button"
                      title="Tap to copy address"
                    >
                      <span>{part}</span>
                      {isCopied ? (
                        <Check className="w-3 h-3 text-emerald-400 inline" />
                      ) : (
                        <Copy className="w-3 h-3 text-white/50 group-hover:text-emerald-300 inline" />
                      )}
                    </button>
                  );
                }
                return part;
              })}
            </div>
          )}
        </div>
      </div>

      {/* Terminal Interactive Input Form */}
      <form
        onSubmit={handleCustomRun}
        className="p-3 bg-white/5 border-t border-white/10 flex items-center gap-3 backdrop-blur-md"
      >
        <div className="pl-3 text-emerald-400 font-mono text-sm font-semibold">
          kp &gt;
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask KP agent to check balance or execute transaction..."
          className="flex-1 bg-transparent text-white font-mono text-sm placeholder:text-white/30 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isExecuting || !input.trim()}
          className="px-4 py-2 rounded-xl bg-[#0ab955] hover:bg-[#09a04a] text-white text-xs font-semibold flex items-center gap-1.5 apple-button disabled:opacity-50 transition-all shadow-md shadow-[#0ab955]/20"
        >
          <span>Run</span>
          <Send className="w-3 h-3" />
        </button>
      </form>
    </div>
  );
}
