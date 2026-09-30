"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import { saveWorkingHours } from "@/app/(admin)/actions/settings";
import type { WorkingBlock } from "@/lib/data/types";

const DAYS = [
  { n: 1, l: "Lunes" }, { n: 2, l: "Martes" }, { n: 3, l: "Miércoles" }, { n: 4, l: "Jueves" },
  { n: 5, l: "Viernes" }, { n: 6, l: "Sábado" }, { n: 0, l: "Domingo" },
];
const field = "rounded-lg border border-roseBrand-200 bg-white px-2 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-roseBrand-500";

export function WorkingHoursForm({ initial }: { initial: WorkingBlock[] }) {
  const [blocks, setBlocks] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const update = (i: number, patch: Partial<WorkingBlock>) => setBlocks((b) => b.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  return (
    <div className="space-y-4">
      {DAYS.map(({ n, l }) => {
        const rows = blocks.map((b, i) => ({ b, i })).filter((r) => r.b.day === n);
        return (
          <div key={n} className="flex flex-wrap items-start gap-3 border-b border-roseBrand-100 pb-3 last:border-0">
            <span className="w-24 pt-1 text-sm font-medium">{l}</span>
            <div className="flex-1 space-y-2">
              {rows.length === 0 && <span className="text-xs text-roseBrand-800/75">No atiende</span>}
              {rows.map(({ b, i }) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="time" aria-label={`${l} inicio`} value={b.start} onChange={(e) => update(i, { start: e.target.value })} className={field} />
                  <span>–</span>
                  <input type="time" aria-label={`${l} fin`} value={b.end} onChange={(e) => update(i, { end: e.target.value })} className={field} />
                  <button type="button" aria-label={`Quitar bloque de ${l}`} onClick={() => setBlocks((x) => x.filter((_, j) => j !== i))}
                    className="rounded p-1 text-red-500 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-roseBrand-500 focus-visible:outline-none"><Icon icon="lucide:x" /></button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setBlocks((x) => [...x, { day: n, start: "09:00", end: "12:00" }])}
              className="flex items-center gap-1 text-xs font-medium text-roseBrand-700 hover:underline focus-visible:ring-2 focus-visible:ring-roseBrand-500 focus-visible:outline-none">
              <Icon icon="lucide:plus" /> Bloque
            </button>
          </div>
        );
      })}
      <div className="flex items-center gap-3">
        <button type="button" disabled={pending}
          onClick={() => { setMsg(null); start(async () => { const r = await saveWorkingHours(blocks); setMsg(r.ok ? { ok: true, text: "Horario guardado." } : { ok: false, text: r.error }); }); }}
          className="rounded-xl bg-roseBrand-700 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-roseBrand-800 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-roseBrand-500 focus-visible:ring-offset-2 focus-visible:outline-none">
          {pending ? "Guardando…" : "Guardar horario"}
        </button>
        {msg && <span role="status" className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-700"}`}>{msg.text}</span>}
      </div>
    </div>
  );
}
