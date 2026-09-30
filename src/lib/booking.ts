export const DOCTOR = {
  name: "Dra. Mirian Galán",
  title: "Nutricionista & Nutrióloga Clínica",
  bio: "Especialista en composición corporal, nutrición clínica, tratamientos estéticos integrales y educación nutricional.",
  fee: 4000,
  currency: "RD$",
  city: "Santo Domingo, República Dominicana",
  address: "Consultorio Nutricional, Santo Domingo",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Santo+Domingo",
  timezone: "America/Santo_Domingo",
  utcOffset: "-04:00", // RD no usa horario de verano
  slotMinutes: 30,
  minNoticeMinutes: 60,
  maxDaysAhead: 90,
  defaultWorkingDays: [1, 2, 3, 4, 5],
} as const;

export const APPOINTMENT_TYPES = ["PRESENCIAL", "VIRTUAL"] as const;
export type AppointmentType = (typeof APPOINTMENT_TYPES)[number];

export const PATIENT_TYPES = ["NEW", "EXISTING"] as const;
export type PatientType = (typeof PATIENT_TYPES)[number];

export type Slot = { time: string; available: boolean };

export type BookingResult =
  | { ok: true; appointmentId: string; meetLink?: string; uploadUrl: string; firstName: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  return `${String(h % 12 || 12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export function formatDateLong(date: string) {
  const d = new Date(`${date}T12:00:00${DOCTOR.utcOffset}`);
  const s = new Intl.DateTimeFormat("es-DO", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: DOCTOR.timezone }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Convierte fecha + hora locales del consultorio a un instante UTC. */
export function localToUtc(date: string, time: string) {
  return new Date(`${date}T${time}:00${DOCTOR.utcOffset}`);
}

/** Fecha (YYYY-MM-DD) y minutos del día en hora local del consultorio. */
export function localNow(now = Date.now()) {
  const d = new Date(now - 4 * 3600_000);
  return { date: d.toISOString().slice(0, 10), minutes: d.getUTCHours() * 60 + d.getUTCMinutes() };
}
