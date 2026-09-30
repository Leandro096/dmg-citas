"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { getAvailability } from "@/app/(admin)/actions/availability";
import { createStaffAppointment } from "@/app/(admin)/actions/staff-booking";
import { Calendar } from "@/components/booking/Calendar";
import { Icon } from "@/components/ui/Icon";
import { DOCTOR, formatDateLong, formatTime, localNow, type AppointmentType, type Slot } from "@/lib/booking";

type PatientOption = { id: string; name: string; email: string };

const card = "rounded-2xl border border-roseBrand-200/60 bg-nude-50 p-6 shadow-bento";
const field = "w-full rounded-xl border border-roseBrand-200 bg-white px-3 py-2.5 text-sm text-roseBrand-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-roseBrand-500";
const ring = "focus-visible:ring-2 focus-visible:ring-roseBrand-500 focus-visible:outline-none";

export function StaffBookingForm({ patients, workingDays, initialPatientId }: { patients: PatientOption[]; workingDays: number[]; initialPatientId?: string }) {
  const today = localNow().date;
  const maxDate = new Date(new Date(`${today}T12:00:00Z`).getTime() + DOCTOR.maxDaysAhead * 86400_000).toISOString().slice(0, 10);

  const [mode, setMode] = useState<"EXISTING" | "NEW">(initialPatientId || patients.length ? "EXISTING" : "NEW");
  const [filter, setFilter] = useState("");
  const [patientId, setPatientId] = useState(initialPatientId ?? "");
  const [np, setNp] = useState({ fullName: "", email: "", phone: "", birthDate: "", healthConditions: "" });
  const [type, setType] = useState<AppointmentType>("PRESENCIAL");
  const [mainReason, setMainReason] = useState("");
  const [goals, setGoals] = useState("");
  const [month, setMonth] = useState({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) - 1 });
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<{ date: string; list: Slot[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [done, setDone] = useState<{ uploadUrl: string } | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    getAvailability(date).then((list) => !cancelled && setSlots({ date, list }));
    return () => { cancelled = true; };
  }, [date]);

  const shown = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return patients.filter((p) => p.id === patientId || !q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q));
  }, [patients, filter, patientId]);

  const fe = (k: string) => fieldErrors[k]?.[0] && <p className="mt-1 text-xs text-red-700">{fieldErrors[k][0]}</p>;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "EXISTING" && !patientId) return setError("Selecciona una paciente.");
    if (!date || !time) return setError("Selecciona una fecha y un horario.");
    setError(null);
    setFieldErrors({});
    start(async () => {
      const res = await createStaffAppointment({
        ...(mode === "EXISTING" ? { patientId } : { ...np }),
        appointmentType: type, date, time, mainReason, goals,
      });
      if (res.ok) setDone({ uploadUrl: res.uploadUrl });
      else {
        setError(res.error);
        setFieldErrors(res.fieldErrors ?? {});
        if (!res.fieldErrors) getAvailability(date).then((list) => setSlots({ date, list }));
      }
    });
  };

  if (done) {
    return (
      <div className={`${card} space-y-3 text-center`} role="status">
        <Icon icon="lucide:check-circle-2" className="mx-auto text-4xl text-emerald-700" />
        <h2 className="text-2xl text-roseBrand-900">Cita creada</h2>
        <p className="text-sm text-roseBrand-800/80">{date && time && `${formatDateLong(date)} · ${formatTime(time)}`}. Se envió la confirmación y la guía por correo.</p>
        <div className="flex flex-wrap justify-center gap-3 text-sm">
          <Link href="/dashboard" className="font-medium text-roseBrand-700 underline">Ir a citas</Link>
          <a href={done.uploadUrl} className="font-medium text-roseBrand-700 underline" target="_blank" rel="noreferrer">Enlace para subir estudios</a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-5 md:grid-cols-12" noValidate>
      <div className={`${card} space-y-3 md:col-span-7`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg text-roseBrand-900">Paciente</h2>
          <div role="radiogroup" aria-label="Tipo de paciente" className="flex rounded-full border border-roseBrand-200 bg-roseBrand-100 p-0.5 text-xs font-medium">
            {([["EXISTING", "Existente"], ["NEW", "Nueva"]] as const).map(([v, l]) => (
              <button key={v} type="button" role="radio" aria-checked={mode === v} onClick={() => { setMode(v); setFieldErrors({}); }}
                className={`rounded-full px-3 py-2 transition-colors ${ring} ${mode === v ? "bg-roseBrand-700 text-white" : "text-roseBrand-800"}`}>{l}</button>
            ))}
          </div>
        </div>

        {mode === "EXISTING" ? (
          <div className="space-y-2">
            <input aria-label="Buscar paciente" placeholder="Buscar por nombre o correo" value={filter} onChange={(e) => setFilter(e.target.value)} className={field} />
            <select aria-label="Paciente" size={6} value={patientId} onChange={(e) => setPatientId(e.target.value)} className={field}>
              {shown.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.email}</option>)}
            </select>
            {!patients.length && <p className="text-xs text-roseBrand-800/80">Aún no hay pacientes: registra una nueva.</p>}
          </div>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            <div className="sm:col-span-2"><input aria-label="Nombre completo" placeholder="Nombre completo" value={np.fullName} onChange={(e) => setNp({ ...np, fullName: e.target.value })} className={field} />{fe("fullName")}</div>
            <div><input type="email" aria-label="Correo" placeholder="Correo" value={np.email} onChange={(e) => setNp({ ...np, email: e.target.value })} className={field} />{fe("email")}</div>
            <div><input type="tel" aria-label="WhatsApp" placeholder="WhatsApp" value={np.phone} onChange={(e) => setNp({ ...np, phone: e.target.value })} className={field} />{fe("phone")}</div>
            <div><label className="mb-1 block text-xs text-roseBrand-800/80" htmlFor="sb-birth">Fecha de nacimiento (opcional)</label>
              <input id="sb-birth" type="date" max={today} value={np.birthDate} onChange={(e) => setNp({ ...np, birthDate: e.target.value })} className={field} /></div>
            <div className="sm:col-span-2"><textarea aria-label="Condiciones de salud" rows={2} placeholder="Condiciones de salud diagnosticadas (opcional)" value={np.healthConditions} onChange={(e) => setNp({ ...np, healthConditions: e.target.value })} className={field} /></div>
          </div>
        )}

        <div>
          <textarea aria-label="Motivo de la consulta" rows={2} placeholder="Motivo de la consulta" value={mainReason} onChange={(e) => setMainReason(e.target.value)} className={field} />
          {fe("mainReason")}
        </div>
        <textarea aria-label="Objetivo" rows={2} placeholder="Objetivo con el acompañamiento nutricional (opcional)" value={goals} onChange={(e) => setGoals(e.target.value)} className={field} />
      </div>

      <div className={`${card} md:col-span-5`}>
        <h2 className="text-lg text-roseBrand-900">Fecha</h2>
        <Calendar month={month} onMonthChange={setMonth} selected={date} onSelect={(d) => { setDate(d); setTime(null); }} today={today} maxDate={maxDate} workingDays={workingDays} />
      </div>

      <div className={`${card} md:col-span-7`}>
        <h2 className="mb-3 text-lg text-roseBrand-900">Horario {date && <span className="text-xs font-medium text-roseBrand-700">· {formatDateLong(date)}</span>}</h2>
        {!date ? <p className="text-sm text-roseBrand-800/80">Elige un día.</p>
          : slots?.date !== date ? <p className="text-sm text-roseBrand-800/80" role="status">Buscando horarios…</p>
          : !slots.list.length ? <p className="text-sm text-roseBrand-800/80">No hay horarios este día.</p>
          : (
            <div className="grid grid-cols-2 gap-2.5 text-sm sm:grid-cols-4">
              {slots.list.map((s) => (
                <button key={s.time} type="button" disabled={!s.available} onClick={() => setTime(s.time)} aria-pressed={s.time === time}
                  className={`rounded-xl border px-3 py-3 transition-all ${ring} ${s.time === time ? "border-roseBrand-700 bg-roseBrand-700 font-semibold text-white" : s.available ? "border-roseBrand-200 bg-white hover:border-roseBrand-500" : "cursor-not-allowed border-nude-200 bg-nude-100 text-roseBrand-800/30 line-through"}`}>
                  {formatTime(s.time)}
                </button>
              ))}
            </div>
          )}
      </div>

      <div className={`${card} flex flex-col justify-between gap-4 md:col-span-5`}>
        <div role="radiogroup" aria-label="Modalidad" className="flex w-fit rounded-full border border-roseBrand-200 bg-roseBrand-100 p-0.5 text-xs font-medium">
          {(["PRESENCIAL", "VIRTUAL"] as const).map((t) => (
            <button key={t} type="button" role="radio" aria-checked={type === t} onClick={() => setType(t)}
              className={`rounded-full px-3 py-2 transition-colors ${ring} ${type === t ? "bg-roseBrand-700 text-white" : "text-roseBrand-800"}`}>{t === "PRESENCIAL" ? "Presencial" : "Virtual"}</button>
          ))}
        </div>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={pending}
          className={`flex w-full items-center justify-center gap-2 rounded-xl bg-roseBrand-700 px-4 py-3 font-semibold text-white shadow-md transition-colors hover:bg-roseBrand-800 disabled:opacity-60 focus-visible:ring-offset-2 ${ring}`}>
          <Icon icon={pending ? "lucide:loader-2" : "lucide:calendar-plus"} className={pending ? "animate-spin" : ""} />
          {pending ? "Creando…" : "Crear cita"}
        </button>
      </div>
    </form>
  );
}
