"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertPermission } from "@/lib/auth";
import { APPOINTMENT_TYPES, type BookingResult } from "@/lib/booking";
import { createBooking } from "@/lib/booking-service";
import { db } from "@/lib/data";

const staffSchema = z
  .object({
    patientId: z.uuid().optional(),
    fullName: z.string().trim().max(100).optional(),
    email: z.email("Correo inválido").max(150).optional(),
    phone: z.string().trim().min(7, "Teléfono inválido").max(20).optional(),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
    healthConditions: z.string().trim().max(1000).optional(),
    appointmentType: z.enum(APPOINTMENT_TYPES),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^\d{2}:\d{2}$/),
    mainReason: z.string().trim().min(3, "Indica el motivo de la consulta").max(1000),
    goals: z.string().trim().max(1000).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.patientId) return;
    const need = (k: "fullName" | "email" | "phone", msg: string) => !v[k] && ctx.addIssue({ code: "custom", path: [k], message: msg });
    need("fullName", "Ingresa el nombre");
    need("email", "Ingresa el correo");
    need("phone", "Ingresa el teléfono");
  });

export type StaffBookingInput = z.input<typeof staffSchema>;

/** Cita creada por la doctora o personal con `appointments:write` (paciente existente o nueva). */
export async function createStaffAppointment(input: StaffBookingInput): Promise<BookingResult> {
  await assertPermission("appointments:write");
  const parsed = staffSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Revisa los datos ingresados.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const v = parsed.data;

  let existing = false;
  let { fullName, email, phone } = { fullName: v.fullName ?? "", email: v.email ?? "", phone: v.phone ?? "" };
  if (v.patientId) {
    const p = await db().getPatient(v.patientId);
    if (!p) return { ok: false, error: "Paciente no encontrado." };
    ({ fullName, email, phone } = p);
    existing = true; // correo + teléfono coinciden por construcción
  }

  const res = await createBooking({
    existing,
    fullName, email, phone,
    birthDate: v.birthDate || null,
    identificationId: null,
    healthConditions: existing ? null : v.healthConditions || null,
    appointmentType: v.appointmentType,
    date: v.date,
    time: v.time,
    mainReason: v.mainReason,
    goals: v.goals || null,
  });
  if (res.ok) {
    revalidatePath("/dashboard");
    revalidatePath("/history");
    revalidatePath("/patients");
  }
  return res;
}
