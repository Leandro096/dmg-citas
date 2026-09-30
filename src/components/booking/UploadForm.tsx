"use client";

import { useRef, useState, useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import { uploadDocuments } from "@/app/(public)/actions/documents";

export function UploadForm({ token }: { token: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [names, setNames] = useState<string[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setMsg(null);
    start(async () => {
      const res = await uploadDocuments(token, fd);
      if (res.ok) {
        setMsg({ ok: true, text: `Listo: se subieron ${res.uploaded} archivo(s). ¡Gracias!` });
        setNames([]);
        if (ref.current) ref.current.value = "";
      } else {
        setMsg({ ok: false, text: res.error });
      }
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-roseBrand-200 bg-white p-8 text-center text-sm text-roseBrand-800 transition-colors hover:border-roseBrand-500 focus-within:ring-2 focus-within:ring-roseBrand-500">
        <Icon icon="lucide:upload-cloud" className="text-3xl text-roseBrand-700" />
        <span className="font-medium">Toca para elegir tus estudios</span>
        <span className="text-xs text-roseBrand-800/75">PDF, JPG, PNG, WEBP o HEIC · máx. 10 MB por archivo</span>
        <input ref={ref} name="files" type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp,image/heic" className="sr-only"
          onChange={(e) => setNames([...(e.target.files ?? [])].map((f) => f.name))} />
      </label>
      {names.length > 0 && (
        <ul className="space-y-1 text-xs text-roseBrand-800">
          {names.map((n) => <li key={n} className="flex items-center gap-1.5"><Icon icon="lucide:file" className="text-roseBrand-700" />{n}</li>)}
        </ul>
      )}
      {msg && <p role="status" className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-700"}`}>{msg.text}</p>}
      <button type="submit" disabled={pending || !names.length}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-roseBrand-700 py-3 font-semibold text-white shadow-md transition-colors hover:bg-roseBrand-800 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-roseBrand-500 focus-visible:ring-offset-2 focus-visible:outline-none">
        <Icon icon={pending ? "lucide:loader-2" : "lucide:send"} className={pending ? "animate-spin" : ""} />
        {pending ? "Subiendo…" : "Enviar estudios"}
      </button>
    </form>
  );
}
