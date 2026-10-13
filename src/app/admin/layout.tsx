"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Scissors,
  Clock,
  BarChart3,
  Users,
  Mail,
  Rocket,
  LogOut,
  Menu,
  X,
  Loader2,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/admin/hairstyles", label: "Hairstyles", icon: Scissors },
  { href: "/admin/barbers", label: "Barbers", icon: Users },
  { href: "/admin/availability", label: "Availability", icon: Clock },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/emails", label: "Emails", icon: Mail },
  { href: "/admin/deploy", label: "Deploy", icon: Rocket },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(pathname !== "/admin/login");
  const [authed, setAuthed] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setChecking(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/admin/me");
        if (!res.ok) {
          router.replace("/admin/login");
          return;
        }
        setAuthed(true);
      } catch {
        router.replace("/admin/login");
      } finally {
        setChecking(false);
      }
    })();
  }, [pathname, router]);

  if (pathname === "/admin/login") return <>{children}</>;

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#c9a86a]" />
      </div>
    );
  }
  if (!authed) return null;

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link href="/admin" className="flex items-center gap-3 px-5 pt-6">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#e8cf9a] to-[#8a6d35] text-[#0b0b0d]">
          <Scissors className="h-5 w-5" strokeWidth={2.5} />
        </span>
        <span>
          <span className="font-display block text-lg font-bold leading-none">SHARPFADE</span>
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#c9a86a]">Admin</span>
        </span>
      </Link>
      <nav className="mt-6 flex-1 space-y-1 px-3">
        {NAV.map((n) => {
          const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                active ? "bg-[#c9a86a] text-[#0b0b0d]" : "text-[#a7a7b0] hover:bg-white/5 hover:text-white"
              }`}
            >
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 p-3">
        <Link href="/" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#a7a7b0] hover:bg-white/5 hover:text-white">
          ← View shop
        </Link>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/10"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#08080a]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-white/10 bg-[#0e0e11] lg:block">
        {sidebar}
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-[#0e0e11]">{sidebar}</aside>
        </div>
      )}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/10 bg-[#08080a]/90 px-4 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} className="grid h-9 w-9 place-items-center rounded-lg border border-white/10">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-display font-bold">SHARPFADE Admin</span>
        </div>
        <div className="p-4 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
