import "server-only";
import type { AppointmentView } from "@/components/admin/AppointmentCard";
import { db, type AppointmentFilter } from "@/lib/data";
import { appUrl } from "@/lib/email";

export type { AppointmentFilter };
export type AppointmentRow = AppointmentView & { ts: number; patientId: string };

const nowMs = () => Date.now();
const ageFrom = (birth: string | null) => (birth ? Math.floor((nowMs() - new Date(birth).getTime()) / 31_557_600_000) : null);

/** Citas activas (sin soft-delete) con paciente y documentos (URLs firmadas de 1 h en Supabase). */
export async function loadAppointments(f: AppointmentFilter = {}): Promise<{ rows: AppointmentRow[]; total: number }> {
  const { rows, total } = await db().listAppointments(f);
  const urls = await db().documentUrls(rows.flatMap((r) => r.docs));

  return {
    total,
    rows: rows.map((r) => {
      const local = new Date(new Date(r.startTime).getTime() - 4 * 3600_000).toISOString();
      return {
        ts: new Date(r.startTime).getTime(),
        patientId: r.patientId,
        id: r.id, date: local.slice(0, 10), time: local.slice(11, 16), status: r.status, type: r.type,
        mainReason: r.mainReason, goals: r.goals, meetLink: r.meetLink, syncStatus: r.syncStatus,
        uploadUrl: `${appUrl()}/documentos/${r.uploadToken}`,
        patient: { name: r.patient.fullName, email: r.patient.email, phone: r.patient.phone, birthDate: r.patient.birthDate, age: ageFrom(r.patient.birthDate), conditions: r.patient.healthConditions },
        docs: r.docs.map((d) => ({ id: d.id, name: d.name, url: urls.get(d.id) ?? null })),
      };
    }),
  };
}

export const currentTime = nowMs;
