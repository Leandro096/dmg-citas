import "server-only";
import { getSlots } from "@/lib/availability";
import { DOCTOR, localToUtc, type BookingResult } from "@/lib/booking";
import { db, type AppointmentType } from "@/lib/data";
import { appUrl, sendBookingEmail } from "@/lib/email";
import { createCalendarEvent, getBusyRanges } from "@/lib/google";

export const SLOT_TAKEN = "Ese horario ya no está disponible. Elige otro.";

export type BookingParams = {
  existing: boolean; // true: la paciente debe coincidir por correo + teléfono
  fullName: string;
  email: string;
  phone: string;
  birthDate: string | null;
  identificationId: string | null;
  healthConditions: string | null;
  appointmentType: AppointmentType;
  date: string;
  time: string;
  mainReason: string;
  goals: string | null;
};

/**
 * Flujo único de reserva (público y personal): valida horario, reserva atómica
 * (paciente + cita), y luego evento de Google Calendar y correo (best-effort).
 */
export async function createBooking(p: BookingParams): Promise<BookingResult> {
  const slots = await getSlots(p.date);
  if (!slots.some((s) => s.time === p.time && s.available)) return { ok: false, error: SLOT_TAKEN };

  const start = localToUtc(p.date, p.time);
  const end = new Date(start.getTime() + DOCTOR.slotMinutes * 60_000);

  // Revalidación final contra Google justo antes de reservar.
  try {
    const busy = await getBusyRanges(start, end);
    if (busy?.some((b) => b.start < end && b.end > start)) return { ok: false, error: SLOT_TAKEN };
  } catch (e) {
    console.error("[booking] freebusy falló:", e);
  }

  const out = await db().book({
    existing: p.existing, fullName: p.fullName, email: p.email, phone: p.phone, birthDate: p.birthDate,
    identificationId: p.identificationId, healthConditions: p.healthConditions, type: p.appointmentType,
    start, end, mainReason: p.mainReason, goals: p.goals,
  });

  if (!out.ok) {
    if (out.code === "SLOT_TAKEN") return { ok: false, error: SLOT_TAKEN };
    if (out.code === "PATIENT_NOT_FOUND") {
      return { ok: false, error: "No encontramos un registro con ese correo y teléfono. Verifica los datos o elige “Soy paciente nueva”." };
    }
    return { ok: false, error: "No pudimos registrar la cita. Intenta de nuevo." };
  }

  const uploadUrl = `${appUrl()}/documentos/${out.uploadToken}`;

  // La cita ya está reservada; el evento de Google y el correo son best-effort.
  let meetLink: string | undefined;
  try {
    const ev = await createCalendarEvent({
      appointmentId: out.appointmentId,
      summary: `Consulta nutricional: ${out.patientName}`,
      description: `Motivo: ${p.mainReason}\nObjetivo: ${p.goals ?? "—"}\nTeléfono: ${p.phone}`,
      start,
      end,
      attendeeEmail: p.email,
      virtual: p.appointmentType === "VIRTUAL",
      location: DOCTOR.address,
    });
    meetLink = ev?.meetLink;
    await db().updateSync(out.appointmentId, { eventId: ev?.eventId ?? null, meetLink: meetLink ?? null, status: ev ? "SYNCED" : "SKIPPED" });
  } catch (e) {
    console.error("[booking] Google Calendar falló:", e);
    await db().updateSync(out.appointmentId, { eventId: null, meetLink: null, status: "FAILED" });
  }

  try {
    await sendBookingEmail({ to: p.email, name: out.patientName, date: p.date, time: p.time, type: p.appointmentType, meetLink, uploadUrl });
  } catch (e) {
    console.error("[booking] correo falló:", e);
  }

  return { ok: true, appointmentId: out.appointmentId, meetLink, uploadUrl, firstName: out.patientName.split(" ")[0] };
}
