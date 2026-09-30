"use server";

import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth";
import { db, type AppointmentStatus } from "@/lib/data";
import { deleteCalendarEvent } from "@/lib/google";

type Result = { ok: true } | { ok: false; error: string };
const STATUSES: AppointmentStatus[] = ["CONFIRMED", "CANCELLED", "COMPLETED"];

async function dropEvent(appointmentId: string) {
  const eventId = await db().getEventId(appointmentId);
  if (eventId) await deleteCalendarEvent(eventId).catch((e) => console.error("[admin] borrar evento:", e));
}

export async function setAppointmentStatus(id: string, status: AppointmentStatus): Promise<Result> {
  if (!STATUSES.includes(status)) return { ok: false, error: "Estado inválido." };
  // Cancelar requiere appointments:delete (solo DOCTOR); el resto, appointments:write.
  await assertPermission(status === "CANCELLED" ? "appointments:delete" : "appointments:write");

  if (!(await db().setStatus(id, status))) return { ok: false, error: "No se pudo actualizar la cita." };
  if (status === "CANCELLED") await dropEvent(id);
  revalidatePath("/dashboard");
  revalidatePath("/history");
  revalidatePath("/patients", "layout");
  return { ok: true };
}

export async function deleteAppointment(id: string): Promise<Result> {
  await assertPermission("appointments:delete");
  if (!(await db().softDeleteAppointment(id))) return { ok: false, error: "No se pudo eliminar la cita." };
  await dropEvent(id);
  revalidatePath("/dashboard");
  revalidatePath("/history");
  revalidatePath("/patients", "layout");
  return { ok: true };
}

export async function deletePatient(id: string): Promise<Result> {
  await assertPermission("appointments:delete");
  if (!(await db().softDeletePatient(id))) return { ok: false, error: "No se pudo eliminar el paciente." };
  revalidatePath("/patients", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/history");
  return { ok: true };
}
