import type { Metadata } from "next";
import { Science_Gothic, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const scienceGothic = Science_Gothic({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KP — Onchain AI Agent Platform",
  description: "The fluid, zero-to-one platform for AI agents executing onchain transactions via KeeperHub and Gemini.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${scienceGothic.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#0a0a0c] text-[#f5f5f7] selection:bg-[#0ab955]/30 selection:text-emerald-300">
        {children}
      </body>
    </html>
  );
}
