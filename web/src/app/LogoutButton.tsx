"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="text-sm bg-kp-card border border-kp-border text-gray-300 hover:bg-gray-800 px-4 py-2 transition-colors shadow-sm"
    >
      Sign out
    </button>
  );
}
