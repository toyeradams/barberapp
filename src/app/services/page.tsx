"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, ArrowRight, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/time";

type S = { id: number; name: string; description: string; priceCents: number; durationMinutes: number; category: string; imageUrl: string };

export default function ServicesPage() {
  const [styles, setStyles] = useState<S[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    fetch("/api/hairstyles").then((r) => r.json()).then((d) => setStyles(d.hairstyles ?? [])).finally(() => setLoading(false));
  }, []);

  const cats = ["All", ...Array.from(new Set(styles.map((s) => s.category)))];
  const list = filter === "All" ? styles : styles.filter((s) => s.category === filter);

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <p className="text-center text-xs font-bold uppercase tracking-[0.3em] text-[#c9a86a]">Menu & pricing</p>
      <h1 className="font-display mt-2 text-center text-4xl font-bold md:text-5xl">
        Services & <span className="text-gold-gradient italic">prices</span>
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-center text-[#a7a7b0]">
        Every service includes consultation, precision cut and style finish. No hidden fees, ever.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`rounded-full px-5 py-2 text-sm font-bold transition ${filter === c ? "bg-[#c9a86a] text-[#0b0b0d]" : "border border-white/15 text-[#a7a7b0] hover:border-white/30"}`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-[#c9a86a]" /></div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => (
            <article key={s.id} className="card-sheen overflow-hidden rounded-2xl border border-white/10 bg-[#131316]">
              <div className="relative h-48">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.imageUrl} alt={s.name} className="h-full w-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#131316] via-transparent to-transparent" />
                <span className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#e8cf9a] backdrop-blur">{s.category}</span>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-bold">{s.name}</h3>
                  <span className="shrink-0 rounded-full bg-[#c9a86a]/15 px-3 py-1 text-base font-extrabold text-[#e8cf9a]">{formatPrice(s.priceCents)}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[#a7a7b0]">{s.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-[#c9a86a]"><Clock className="h-3.5 w-3.5" /> {s.durationMinutes} min</span>
                  <Link href="/book" className="group inline-flex items-center gap-1.5 rounded-full bg-[#c9a86a] px-4 py-2 text-xs font-extrabold text-[#0b0b0d] transition hover:bg-[#e8cf9a]">
                    Book this <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
