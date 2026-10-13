"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, Loader2, ArrowRight } from "lucide-react";

type B = { id: number; name: string; title: string; bio: string; avatarUrl: string; specialties: string; rating: string };

export default function BarbersPage() {
  const [barbers, setBarbers] = useState<B[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/barbers").then((r) => r.json()).then((d) => setBarbers(d.barbers ?? [])).finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="text-center text-xs font-bold uppercase tracking-[0.3em] text-[#c9a86a]">The team</p>
      <h1 className="font-display mt-2 text-center text-4xl font-bold md:text-5xl">
        Meet your <span className="text-gold-gradient italic">barbers</span>
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-center text-[#a7a7b0]">
        Licensed, battle-tested, obsessed with detail. Pick your favourite when booking — or trust the first available chair.
      </p>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-[#c9a86a]" /></div>
      ) : (
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {barbers.map((b) => (
            <article key={b.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#131316]">
              <div className="relative h-72">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.avatarUrl} alt={b.name} className="h-full w-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#131316] via-[#131316]/30 to-transparent" />
                <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-black/60 px-3 py-1.5 text-xs font-bold text-[#e8cf9a] backdrop-blur">
                  <Star className="h-3.5 w-3.5 fill-[#c9a86a] text-[#c9a86a]" /> {Number(b.rating).toFixed(2)}
                </span>
                <div className="absolute bottom-4 left-5 right-5">
                  <h3 className="text-xl font-bold">{b.name}</h3>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#c9a86a]">{b.title}</p>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm leading-relaxed text-[#a7a7b0]">{b.bio}</p>
                {b.specialties && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {b.specialties.split(",").map((s) => (
                      <span key={s} className="rounded-full border border-[#c9a86a]/30 bg-[#c9a86a]/10 px-3 py-1 text-xs font-semibold text-[#e8cf9a]">
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                )}
                <Link
                  href="/book"
                  className="group mt-5 flex items-center justify-center gap-2 rounded-full bg-[#c9a86a] px-4 py-3 text-sm font-extrabold text-[#0b0b0d] transition hover:bg-[#e8cf9a]"
                >
                  Book with {b.name.split(" ")[0]} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
