"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scissors, Menu, X } from "lucide-react";
import { useState } from "react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/barbers", label: "Barbers" },
  { href: "/book", label: "Book Now" },
  { href: "/booking", label: "My Booking" },
];

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  if (pathname.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b0b0d]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#e8cf9a] to-[#8a6d35] text-[#0b0b0d]">
            <Scissors className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <span className="leading-tight">
            <span className="font-display block text-lg font-bold tracking-wide">
              SHARP<span className="text-gold-gradient">FADE</span>
            </span>
            <span className="block text-[10px] uppercase tracking-[0.3em] text-[#a7a7b0]">
              Barbershop
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href + l.label}
              href={l.href}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                pathname === l.href
                  ? "bg-[#c9a86a]/15 text-[#e8cf9a]"
                  : "text-[#a7a7b0] hover:bg-white/5 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/book"
            className="ml-3 rounded-full bg-[#c9a86a] px-5 py-2.5 text-sm font-bold text-[#0b0b0d] transition hover:bg-[#e8cf9a] hover:shadow-[0_0_24px_rgba(201,168,106,0.4)]"
          >
            Book a Chair →
          </Link>
        </nav>

        <button
          className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <nav className="border-t border-white/10 bg-[#0b0b0d] px-4 py-3 md:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href + l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-3 text-sm font-medium text-[#d8d8de] hover:bg-white/5"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-3 text-sm font-medium text-[#a7a7b0] hover:bg-white/5"
          >
            Admin →
          </Link>
        </nav>
      )}
    </header>
  );
}
