"use client";

import { useEffect, useState } from "react";
import { Loader2, MailCheck, MailWarning, Eye, X } from "lucide-react";

export default function AdminEmailsPage() {
  const [emails, setEmails] = useState<any[]>([]);
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/emails")
      .then((r) => r.json())
      .then((d) => {
        setEmails(d.emails ?? []);
        setProvider(d.provider ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Emails</h1>
      <p className="mt-1 text-sm text-[#a7a7b0]">Confirmation email delivery log.</p>

      {provider && (
        <div className={`mt-5 flex items-start gap-3 rounded-2xl border p-4 ${provider.configured ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"}`}>
          {provider.configured ? <MailCheck className="h-5 w-5 shrink-0 text-emerald-300" /> : <MailWarning className="h-5 w-5 shrink-0 text-amber-300" />}
          <div className="text-sm">
            <p className="font-bold">
              Provider: <span className="font-mono">{provider.provider}</span> {provider.configured ? "· live" : "· demo mode"}
            </p>
            <p className="mt-1 text-[#a7a7b0]">{provider.hint}</p>
            {!provider.configured && (
              <p className="mt-2 text-xs text-[#a7a7b0]">
                For Resend, set both <code className="rounded bg-white/10 px-1 font-mono">RESEND_API_KEY</code> and <code className="rounded bg-white/10 px-1 font-mono">EMAIL_FROM</code> (a verified sender). Or configure <code className="rounded bg-white/10 px-1 font-mono">SMTP_HOST</code>, <code className="rounded bg-white/10 px-1 font-mono">SMTP_USER</code>, <code className="rounded bg-white/10 px-1 font-mono">SMTP_PASS</code> and <code className="rounded bg-white/10 px-1 font-mono">EMAIL_FROM</code> in Vercel → Project → Settings → Environment Variables, then redeploy. No provider means no email is sent. See the Deploy tab.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-[#131316]">
        {loading ? (
          <div className="grid h-48 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-[#c9a86a]" /></div>
        ) : emails.length === 0 ? (
          <p className="p-10 text-center text-sm text-[#6b6b72]">No email attempts yet — delivery attempts appear here after a booking.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-widest text-[#6b6b72]">
                  <th className="px-4 py-3">To</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Sent</th>
                  <th className="px-4 py-3 text-right">Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {emails.map((e) => (
                  <tr key={e.id}>
                    <td className="px-4 py-3">{e.toEmail}</td>
                    <td className="px-4 py-3 text-[#a7a7b0]">{e.subject}</td>
                    <td className="px-4 py-3 font-mono text-xs">{e.provider}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${e.status === "sent" ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#a7a7b0]">{new Date(e.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setPreview(e)} className="rounded-lg border border-white/15 p-2 hover:border-[#c9a86a]/60">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#131316]">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <p className="text-sm font-bold">Email preview → {preview.toEmail}</p>
              <button onClick={() => setPreview(null)} className="rounded-lg p-1.5 hover:bg-white/10"><X className="h-5 w-5" /></button>
            </div>
            <div className="overflow-y-auto">
              <iframe title="email preview" srcDoc={preview.previewHtml} className="h-[60vh] w-full bg-white" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
