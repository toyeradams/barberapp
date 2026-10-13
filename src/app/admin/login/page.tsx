"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Scissors, Loader2, Lock } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      router.replace("/admin");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#e8cf9a] to-[#8a6d35] text-[#0b0b0d]">
            <Scissors className="h-7 w-7" strokeWidth={2.5} />
          </span>
          <h1 className="font-display mt-4 text-3xl font-bold">Admin Login</h1>
          <p className="mt-1 text-sm text-[#a7a7b0]">SharpFade Barbershop control panel</p>
        </div>
        <form onSubmit={submit} className="mt-8 rounded-2xl border border-white/10 bg-[#131316] p-6">
          <label className="flex items-center gap-2 text-sm font-bold">
            <Lock className="h-4 w-4 text-[#c9a86a]" /> Admin password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            autoFocus
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none placeholder:text-[#4a4a52] focus:border-[#c9a86a]"
          />
          {error && (
            <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>
          )}
          <button
            disabled={loading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#c9a86a] px-4 py-3 text-sm font-extrabold text-[#0b0b0d] transition hover:bg-[#e8cf9a] disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
          </button>
          <p className="mt-4 text-center text-xs text-[#6b6b72]">
            Default password: <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono">admin123</code>
            <br />Change it via the <code className="font-mono">ADMIN_PASSWORD</code> env var.
          </p>
        </form>
      </div>
    </main>
  );
}
