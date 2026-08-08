"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut()}
      type="button"
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 apple-button transition-all backdrop-blur-md"
    >
      <LogOut className="w-3.5 h-3.5" />
      <span>Sign out</span>
    </button>
  );
}
