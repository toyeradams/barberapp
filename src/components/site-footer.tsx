"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scissors, MapPin, Clock, Phone, Mail } from "lucide-react";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return (
    <footer className="border-t border-white/10 bg-[#08080a]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#e8cf9a] to-[#8a6d35] text-[#0b0b0d]">
              <Scissors className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <span className="font-display text-xl font-bold">
              SHARP<span className="text-gold-gradient">FADE</span>
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-[#a7a7b0]">
            Premium cuts, hot-towel shaves and beard architecture. Book online in under a
            minute — instant email confirmation.
          </p>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#c9a86a]">Visit</h4>
          <ul className="mt-4 space-y-3 text-sm text-[#d8d8de]">
            <li className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-[#c9a86a]" /> 24 Gentlemen&apos;s Row, Old Town</li>
            <li className="flex gap-2"><Phone className="h-4 w-4 shrink-0 text-[#c9a86a]" /> (555) 123-4567</li>
            <li className="flex gap-2"><Mail className="h-4 w-4 shrink-0 text-[#c9a86a]" /> hello@sharpfade.shop</li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#c9a86a]">Hours</h4>
          <ul className="mt-4 space-y-2 text-sm text-[#d8d8de]">
            <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-[#c9a86a]" /> Mon – Fri · 9:00 – 19:00</li>
            <li className="pl-6">Saturday · 9:00 – 17:00</li>
            <li className="pl-6">Sunday · Closed</li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#c9a86a]">Quick links</h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/book" className="text-[#d8d8de] hover:text-[#e8cf9a]">Book appointment</Link></li>
            <li><Link href="/services" className="text-[#d8d8de] hover:text-[#e8cf9a]">Services & prices</Link></li>
            <li><Link href="/barbers" className="text-[#d8d8de] hover:text-[#e8cf9a]">Meet the barbers</Link></li>
            <li><Link href="/booking" className="text-[#d8d8de] hover:text-[#e8cf9a]">Find my booking</Link></li>
            <li><Link href="/admin" className="text-[#d8d8de] hover:text-[#e8cf9a]">Admin login</Link></li>
          </ul>
        </div>
      </div>
      <div className="barber-stripes h-1.5 opacity-80" />
      <p className="py-5 text-center text-xs text-[#6b6b72]">
        © {new Date().getFullYear()} SharpFade Barbershop · Crafted with precision
      </p>
    </footer>
  );
}
