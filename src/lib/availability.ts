import "server-only";
import { DOCTOR, localNow, localToUtc, type Slot } from "@/lib/booking";
import { db } from "@/lib/data";
import { getBusyRanges } from "@/lib/google";

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const toTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/** Días de la semana (0=Dom..6=Sáb) con horario activo. */
export async function getWorkingDays(): Promise<number[]> {
  try {
    const days = [...new Set((await db().getWorkingHours()).map((h) => h.day))];
    return days.length ? days : [...DOCTOR.defaultWorkingDays];
  } catch {
    return [...DOCTOR.defaultWorkingDays];
  }
}

/**
 * Horarios del día = jornada laboral - citas en BD - eventos ocupados de Google Calendar.
 * Si Google falla, se degrada a solo-BD (la reserva atómica igual evita el overbooking entre citas).
 */
export async function getSlots(date: string): Promise<Slot[]> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
  const dow = new Date(`${date}T12:00:00Z`).getUTCDay();
  const now = localNow();
  if (date < now.date) return [];

  const dayStart = localToUtc(date, "00:00");
  const dayEnd = new Date(dayStart.getTime() + 86400_000);

  const [hours, booked] = await Promise.all([db().getWorkingHours(), db().getBookedRanges(dayStart, dayEnd)]);
  const blocks = hours.filter((h) => h.day === dow).sort((a, b) => a.start.localeCompare(b.start));
  if (!blocks.length) return [];

  let taken = booked;
  try {
    const busy = await getBusyRanges(dayStart, dayEnd);
    if (busy) taken = taken.concat(busy);
  } catch (e) {
    console.error("[availability] Google freebusy falló, usando solo BD:", e);
  }

  const earliest = now.date === date ? now.minutes + DOCTOR.minNoticeMinutes : -1;
  const slots: Slot[] = [];
  for (const b of blocks) {
    for (let m = toMin(b.start); m + DOCTOR.slotMinutes <= toMin(b.end); m += DOCTOR.slotMinutes) {
      const s = localToUtc(date, toTime(m));
      const e = new Date(s.getTime() + DOCTOR.slotMinutes * 60_000);
      slots.push({ time: toTime(m), available: m >= earliest && !taken.some((t) => t.start < e && t.end > s) });
    }
  }
  return slots;
}
