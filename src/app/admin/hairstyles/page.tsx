"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Pencil, Trash2, X } from "lucide-react";
import { formatPrice } from "@/lib/time";

type H = {
  id: number; name: string; description: string; priceCents: number;
  durationMinutes: number; category: string; imageUrl: string; isActive: boolean; sortOrder: number;
};

const EMPTY = { name: "", description: "", price: "", durationMinutes: 30, category: "Haircut", imageUrl: "", isActive: true, sortOrder: 0 };

const CATEGORIES = ["Haircut", "Fade", "Beard", "Shave", "Package", "Kids", "Color", "Other"];

export default function AdminHairstylesPage() {
  const [rows, setRows] = useState<H[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | { mode: "add" | "edit"; row?: H }>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/hairstyles").then((r) => r.json());
      setRows(res.hairstyles ?? []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  function openAdd() {
    setForm({ ...EMPTY });
    setModal({ mode: "add" });
  }
  function openEdit(row: H) {
    setForm({
      name: row.name,
      description: row.description,
      price: (row.priceCents / 100).toString(),
      durationMinutes: row.durationMinutes,
      category: row.category,
      imageUrl: row.imageUrl,
      isActive: row.isActive,
      sortOrder: row.sortOrder,
    });
    setModal({ mode: "edit", row });
  }

  async function save() {
    if (!form.name.trim()) return alert("Name is required");
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price) || 0,
        durationMinutes: Number(form.durationMinutes) || 30,
        category: form.category,
        imageUrl: form.imageUrl || "https://images.pexels.com/photos/4625626/pexels-photo-4625626.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        isActive: Boolean(form.isActive),
        sortOrder: Number(form.sortOrder) || 0,
      };
      const url = modal?.mode === "edit" ? `/api/admin/hairstyles/${modal.row!.id}` : "/api/admin/hairstyles";
      const res = await fetch(url, {
        method: modal?.mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error || "Save failed");
        return;
      }
      setModal(null);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this hairstyle? Existing bookings keep their snapshot.")) return;
    await fetch(`/api/admin/hairstyles/${id}`, { method: "DELETE" });
    load();
  }

  async function toggle(row: H) {
    await fetch(`/api/admin/hairstyles/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !row.isActive }),
    });
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Hairstyles</h1>
          <p className="mt-1 text-sm text-[#a7a7b0]">Add, edit or hide services — changes go live instantly.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 rounded-full bg-[#c9a86a] px-5 py-2.5 text-sm font-bold text-[#0b0b0d] hover:bg-[#e8cf9a]">
          <Plus className="h-4 w-4" /> Add hairstyle
        </button>
      </div>

      {loading ? (
        <div className="grid h-48 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-[#c9a86a]" /></div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <article key={r.id} className={`overflow-hidden rounded-2xl border bg-[#131316] ${r.isActive ? "border-white/10" : "border-white/5 opacity-60"}`}>
              <div className="relative h-36">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.imageUrl} alt={r.name} className="h-full w-full object-cover" loading="lazy" />
                <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#e8cf9a]">{r.category}</span>
                {!r.isActive && <span className="absolute right-3 top-3 rounded-full bg-red-500/80 px-3 py-1 text-[10px] font-bold uppercase">Hidden</span>}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold">{r.name}</h3>
                  <span className="shrink-0 font-extrabold text-[#e8cf9a]">{formatPrice(r.priceCents)}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-[#a7a7b0]">{r.description}</p>
                <p className="mt-2 text-xs text-[#6b6b72]">{r.durationMinutes} min</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => openEdit(r)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-bold hover:border-[#c9a86a]/60">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button onClick={() => toggle(r)} className="flex-1 rounded-lg border border-white/15 px-3 py-2 text-xs font-bold hover:border-white/40">
                    {r.isActive ? "Hide" : "Show"}
                  </button>
                  <button onClick={() => remove(r.id)} className="rounded-lg border border-red-500/30 px-3 py-2 text-red-300 hover:bg-red-500/10">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#131316] p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{modal.mode === "add" ? "Add hairstyle" : "Edit hairstyle"}</h2>
              <button onClick={() => setModal(null)} className="rounded-lg p-1.5 hover:bg-white/10"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 space-y-3">
              <Field label="Name *">
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Signature Skin Fade" className={input} />
              </Field>
              <Field label="Description">
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="What's included…" className={input} />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Price (ZAR) *">
                  <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={input} />
                </Field>
                <Field label="Duration (min)">
                  <input type="number" min="10" step="5" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} className={input} />
                </Field>
                <Field label="Order">
                  <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} className={input} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Category">
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={input}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Visible">
                  <select value={String(form.isActive)} onChange={(e) => setForm({ ...form, isActive: e.target.value === "true" })} className={input}>
                    <option value="true">Visible on site</option>
                    <option value="false">Hidden</option>
                  </select>
                </Field>
              </div>
              <Field label="Image URL">
                <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://…" className={input} />
              </Field>
              {form.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.imageUrl} alt="" className="h-24 w-full rounded-xl object-cover" />
              )}
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setModal(null)} className="flex-1 rounded-xl border border-white/20 px-4 py-3 text-sm font-bold">Cancel</button>
              <button onClick={save} disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#c9a86a] px-4 py-3 text-sm font-extrabold text-[#0b0b0d] disabled:opacity-60">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} {modal.mode === "add" ? "Add hairstyle" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const input = "w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-[#c9a86a]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-[#a7a7b0]">{label}</span>
      {children}
    </label>
  );
}
