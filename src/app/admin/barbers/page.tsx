"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Pencil, Trash2, X } from "lucide-react";

type B = { id: number; name: string; title: string; bio: string; avatarUrl: string; specialties: string; rating: string; isActive: boolean };
const EMPTY = { name: "", title: "Barber", bio: "", avatarUrl: "", specialties: "", rating: "5.00", isActive: true };

export default function AdminBarbersPage() {
  const [rows, setRows] = useState<B[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | { mode: "add" | "edit"; row?: B }>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/barbers").then((r) => r.json());
      setRows(res.barbers ?? []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  function openAdd() { setForm({ ...EMPTY }); setModal({ mode: "add" }); }
  function openEdit(row: B) {
    setForm({ name: row.name, title: row.title, bio: row.bio, avatarUrl: row.avatarUrl, specialties: row.specialties, rating: row.rating, isActive: row.isActive });
    setModal({ mode: "edit", row });
  }

  async function save() {
    if (!form.name.trim()) return alert("Name required");
    setSaving(true);
    try {
      const payload = { ...form, avatarUrl: form.avatarUrl || "https://images.pexels.com/photos/5337778/pexels-photo-5337778.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800" };
      const url = modal?.mode === "edit" ? `/api/admin/barbers/${modal.row!.id}` : "/api/admin/barbers";
      const res = await fetch(url, { method: modal?.mode === "edit" ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) { alert("Save failed"); return; }
      setModal(null);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this barber?")) return;
    await fetch(`/api/admin/barbers/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Barbers</h1>
          <p className="mt-1 text-sm text-[#a7a7b0]">Your team — shown on the site and in booking.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 rounded-full bg-[#c9a86a] px-5 py-2.5 text-sm font-bold text-[#0b0b0d] hover:bg-[#e8cf9a]">
          <Plus className="h-4 w-4" /> Add barber
        </button>
      </div>

      {loading ? (
        <div className="grid h-48 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-[#c9a86a]" /></div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <article key={r.id} className="rounded-2xl border border-white/10 bg-[#131316] p-5">
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.avatarUrl} alt={r.name} className="h-16 w-16 rounded-full border border-[#c9a86a]/50 object-cover" />
                <div>
                  <h3 className="font-bold">{r.name} {!r.isActive && <span className="ml-1 rounded bg-red-500/20 px-2 py-0.5 text-[10px] uppercase text-red-300">off</span>}</h3>
                  <p className="text-xs text-[#c9a86a]">{r.title} · ★ {Number(r.rating).toFixed(2)}</p>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-xs text-[#a7a7b0]">{r.bio}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => openEdit(r)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-bold hover:border-[#c9a86a]/60">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={async () => {
                    await fetch(`/api/admin/barbers/${r.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !r.isActive }) });
                    load();
                  }}
                  className="flex-1 rounded-lg border border-white/15 px-3 py-2 text-xs font-bold"
                >
                  {r.isActive ? "Deactivate" : "Activate"}
                </button>
                <button onClick={() => remove(r.id)} className="rounded-lg border border-red-500/30 px-3 py-2 text-red-300 hover:bg-red-500/10">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#131316] p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{modal.mode === "add" ? "Add barber" : "Edit barber"}</h2>
              <button onClick={() => setModal(null)} className="rounded-lg p-1.5 hover:bg-white/10"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 space-y-3">
              <Field label="Name *"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Title"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={input} /></Field>
                <Field label="Rating"><input value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} className={input} /></Field>
              </div>
              <Field label="Bio"><textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} className={input} /></Field>
              <Field label="Specialties (comma separated)"><input value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })} placeholder="Skin Fade, Beard Sculpt" className={input} /></Field>
              <Field label="Photo URL"><input value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} placeholder="https://…" className={input} /></Field>
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setModal(null)} className="flex-1 rounded-xl border border-white/20 px-4 py-3 text-sm font-bold">Cancel</button>
              <button onClick={save} disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#c9a86a] px-4 py-3 text-sm font-extrabold text-[#0b0b0d] disabled:opacity-60">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} {modal.mode === "add" ? "Add barber" : "Save changes"}
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
  return <label className="block"><span className="mb-1 block text-xs font-bold uppercase tracking-widest text-[#a7a7b0]">{label}</span>{children}</label>;
}
