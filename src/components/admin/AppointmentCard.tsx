"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import { deleteAppointment, setAppointmentStatus } from "@/app/(admin)/actions/appointments";
import { formatDateLong, formatTime } from "@/lib/booking";

export type AppointmentView = {
  id: string;
  date: string;
  time: string;
  status: "CONFIRMED" | "CANCELLED" | "COMPLETED";
  type: "PRESENCIAL" | "VIRTUAL";
  mainReason: string | null;
  goals: string | null;
  meetLink: string | null;
  syncStatus: string;
  uploadUrl: string;
  patient: { name: string; email: string; phone: string; birthDate: string | null; age: number | null; conditions: string | null };
  docs: { id: string; name: string; url: string | null }[];
};

const badge: Record<string, string> = {
  CONFIRMED: "bg-roseBrand-100 text-roseBrand-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-nude-200 text-roseBrand-800/75 line-through",
};
const btn = "rounded-lg border border-roseBrand-200 bg-white px-2.5 py-1 text-xs font-medium text-roseBrand-800 transition-colors hover:border-roseBrand-500 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-roseBrand-500 focus-visible:outline-none";

function waLink(phone: string, text: string) {
  let d = phone.replace(/\D/g, "");
  if (d.length === 10) d = `1${d}`; // RD / NANP
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
}

export function AppointmentCard({ a, canWrite, canDelete }: { a: AppointmentView; canWrite: boolean; canDelete: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, confirmMsg?: string) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setError(null);
    start(async () => {
      const r = await fn();
      if (!r.ok) setError(r.error ?? "Error");
    });
  };

  return (
    <details className="group rounded-2xl border border-roseBrand-200/60 bg-nude-50 shadow-bento">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1 p-4 focus-visible:ring-2 focus-visible:ring-roseBrand-500 focus-visible:outline-none">
        <span className="min-w-40 font-semibold text-roseBrand-900">{a.patient.name}</span>
        <span className="text-sm">{formatDateLong(a.date)} · {formatTime(a.time)}</span>
        <span className="flex items-center gap-1 text-xs text-roseBrand-800/80">
          <Icon icon={a.type === "VIRTUAL" ? "lucide:video" : "lucide:building-2"} />{a.type === "VIRTUAL" ? "Virtual" : "Presencial"}
        </span>
        <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${badge[a.status]}`}>{a.status}</span>
        {a.docs.length > 0 && <span className="flex items-center gap-1 text-xs text-roseBrand-700"><Icon icon="lucide:paperclip" />{a.docs.length}</span>}
        {a.syncStatus === "FAILED" && <span className="text-xs text-red-700">Sin sincronizar con Google</span>}
        <Icon icon="lucide:chevron-down" className="ml-auto text-roseBrand-700 transition-transform group-open:rotate-180" />
      </summary>

      <div className="grid gap-4 border-t border-roseBrand-100 p-4 text-sm md:grid-cols-2">
        <dl className="space-y-1.5">
          <Item k="Correo" v={a.patient.email} />
          <Item k="WhatsApp" v={a.patient.phone} />
          <Item k="Nacimiento" v={a.patient.birthDate ? `${a.patient.birthDate}${a.patient.age !== null ? ` (${a.patient.age} años)` : ""}` : "—"} />
          <Item k="Condiciones de salud" v={a.patient.conditions ?? "—"} />
        </dl>
        <dl className="space-y-1.5">
          <Item k="Motivo de consulta" v={a.mainReason ?? "—"} />
          <Item k="Objetivo" v={a.goals ?? "—"} />
          {a.meetLink && <div><dt className="text-xs text-roseBrand-800/75">Google Meet</dt><dd><a className="text-roseBrand-700 underline" href={a.meetLink} target="_blank" rel="noreferrer">{a.meetLink}</a></dd></div>}
        </dl>

        <div className="md:col-span-2">
          <h4 className="mb-1 font-sans text-xs font-semibold uppercase tracking-wide text-roseBrand-800/75">Estudios y analíticas</h4>
          {a.docs.length ? (
            <ul className="space-y-1">
              {a.docs.map((d) => (
                <li key={d.id} className="flex items-center gap-1.5">
                  <Icon icon="lucide:file-text" className="text-roseBrand-700" />
                  {d.url ? <a href={d.url} target="_blank" rel="noreferrer" className="text-roseBrand-700 underline">{d.name}</a> : d.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-roseBrand-800/75">Aún no ha subido archivos.</p>
          )}
          <a className={`${btn} mt-2 inline-flex items-center gap-1`} target="_blank" rel="noreferrer"
            href={waLink(a.patient.phone, `Hola ${a.patient.name.split(" ")[0]}, puedes subir tus analíticas o estudios para tu cita aquí: ${a.uploadUrl}`)}>
            <Icon icon="logos:whatsapp-icon" /> Enviar enlace por WhatsApp
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:col-span-2">
          {canWrite && a.status === "CONFIRMED" && (
            <button className={btn} disabled={pending} onClick={() => run(() => setAppointmentStatus(a.id, "COMPLETED"))}>
              <Icon icon="lucide:check" className="mr-1 inline" />Marcar completada
            </button>
          )}
          {canWrite && a.status !== "CONFIRMED" && (
            <button className={btn} disabled={pending} onClick={() => run(() => setAppointmentStatus(a.id, "CONFIRMED"))}>Reabrir</button>
          )}
          {canDelete && a.status !== "CANCELLED" && (
            <button className={`${btn} text-red-700`} disabled={pending}
              onClick={() => run(() => setAppointmentStatus(a.id, "CANCELLED"), "¿Cancelar esta cita? Se eliminará el evento de Google Calendar.")}>
              Cancelar cita
            </button>
          )}
          {canDelete && (
            <button className={`${btn} text-red-700`} disabled={pending}
              onClick={() => run(() => deleteAppointment(a.id), "¿Eliminar esta cita del listado?")}>
              <Icon icon="lucide:trash-2" className="mr-1 inline" />Eliminar
            </button>
          )}
          {error && <span role="alert" className="text-xs text-red-700">{error}</span>}
        </div>
      </div>
    </details>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-roseBrand-800/75">{k}</dt>
      <dd className="whitespace-pre-line">{v}</dd>
    </div>
  );
}
