// Datos de ejemplo para el modo demo. Las fechas son relativas a "hoy" para que siempre haya citas próximas.
import type { AppointmentStatus, AppointmentType, PermissionCode, Role } from "@/lib/data/types";

/** Usuarios del panel (solo demo: contraseñas en claro a propósito). */
export const MOCK_USERS: { id: string; email: string; password: string; fullName: string; role: Role }[] = [
  { id: "00000000-0000-4000-8000-000000000001", email: "doctora@demo.com", password: "Doctora123!", fullName: "Dra. Mirian Galán", role: "DOCTOR" },
  { id: "00000000-0000-4000-8000-000000000002", email: "asistente@demo.com", password: "Asistente123!", fullName: "Sofía Peña", role: "ASSISTANT" },
];

export const ROLE_PERMISSIONS: Record<Role, PermissionCode[]> = {
  DOCTOR: ["appointments:read", "appointments:write", "appointments:delete", "patients:read", "patients:write", "settings:manage"],
  ASSISTANT: ["appointments:read", "appointments:write", "patients:read", "patients:write"],
};

export const MOCK_WORKING_HOURS = [1, 2, 3, 4, 5].flatMap((day) => [
  { day, start: "09:00", end: "12:00" },
  { day, start: "14:00", end: "17:00" },
]);

// --- fechas relativas (hora local RD, UTC-4) ---
const localDay = (offset: number) => new Date(Date.now() - 4 * 3600_000 + offset * 86400_000);
/** Día laborable más cercano en la dirección del offset. */
function weekday(offset: number) {
  let d = localDay(offset);
  const step = offset >= 0 ? 1 : -1;
  while ([0, 6].includes(d.getUTCDay())) d = new Date(d.getTime() + step * 86400_000);
  return d.toISOString().slice(0, 10);
}
export const at = (offset: number, time: string) => new Date(`${weekday(offset)}T${time}:00-04:00`).toISOString();

const p = (n: number) => `00000000-0000-4000-8000-0000000001${String(n).padStart(2, "0")}`;

export const MOCK_PATIENTS = [
  { id: p(1), fullName: "Laura Martínez", email: "laura.martinez@example.com", phone: "+1 (809) 555-0144", birthDate: "1991-04-12", healthConditions: "Hipotiroidismo" },
  { id: p(2), fullName: "José Ramírez", email: "jose.ramirez@example.com", phone: "829-555-0178", birthDate: "1988-09-03", healthConditions: "Ninguna" },
  { id: p(3), fullName: "Ana Mercedes Peña", email: "ana.pena@example.com", phone: "849-555-0112", birthDate: "1995-01-27", healthConditions: "Diabetes tipo 2" },
  { id: p(4), fullName: "Carolina Díaz", email: "carolina.diaz@example.com", phone: "809-555-0190", birthDate: "1984-11-30", healthConditions: "Hipertensión" },
  { id: p(5), fullName: "Rafael Soto", email: "rafael.soto@example.com", phone: "829-555-0133", birthDate: "1999-06-18", healthConditions: "Ninguna" },
  { id: p(6), fullName: "Patricia Núñez", email: "patricia.nunez@example.com", phone: "849-555-0166", birthDate: "1979-02-09", healthConditions: "Colesterol alto" },
];

type SeedAppt = { day: number; time: string; patient: number; status: AppointmentStatus; type?: AppointmentType; reason: string; goals?: string; docs?: string[] };

export const MOCK_APPOINTMENTS: SeedAppt[] = [
  // Historial
  { day: -45, time: "09:00", patient: 0, status: "COMPLETED", reason: "Evaluación nutricional inicial", goals: "Mejorar energía y regular el peso" },
  { day: -30, time: "09:30", patient: 0, status: "COMPLETED", reason: "Control mensual", goals: "Ajustar plan de alimentación" },
  { day: -14, time: "10:00", patient: 0, status: "COMPLETED", reason: "Control mensual", docs: ["analitica-tiroides.pdf"] },
  { day: -40, time: "14:00", patient: 1, status: "COMPLETED", reason: "Nutrición deportiva", goals: "Ganar masa muscular" },
  { day: -20, time: "14:30", patient: 1, status: "COMPLETED", reason: "Seguimiento de entrenamiento" },
  { day: -35, time: "10:30", patient: 2, status: "COMPLETED", reason: "Manejo de diabetes tipo 2", goals: "Controlar glucosa con la alimentación" },
  { day: -21, time: "11:00", patient: 2, status: "COMPLETED", reason: "Revisión de glucemias" },
  { day: -7, time: "09:00", patient: 2, status: "COMPLETED", reason: "Revisión de analíticas", docs: ["hemoglobina-glicosilada.pdf"] },
  { day: -28, time: "15:00", patient: 3, status: "COMPLETED", reason: "Hipertensión: plan bajo en sodio" },
  { day: -10, time: "15:30", patient: 3, status: "COMPLETED", type: "VIRTUAL", reason: "Control de presión y peso" },
  { day: -5, time: "16:00", patient: 4, status: "COMPLETED", reason: "Composición corporal", goals: "Reducir porcentaje de grasa" },
  { day: -3, time: "10:00", patient: 5, status: "CANCELLED", reason: "Control de colesterol" },
  // Próximas
  { day: 1, time: "09:00", patient: 0, status: "CONFIRMED", type: "VIRTUAL", reason: "Control mensual", goals: "Mantener resultados" },
  { day: 1, time: "14:00", patient: 3, status: "CONFIRMED", reason: "Seguimiento de hipertensión" },
  { day: 2, time: "10:30", patient: 1, status: "CONFIRMED", reason: "Plan para competencia", goals: "Optimizar rendimiento" },
  { day: 3, time: "09:30", patient: 4, status: "CONFIRMED", type: "VIRTUAL", reason: "Revisión de composición corporal" },
  { day: 4, time: "15:00", patient: 2, status: "CONFIRMED", reason: "Control de diabetes" },
  { day: 6, time: "11:00", patient: 5, status: "CONFIRMED", reason: "Control de colesterol", goals: "Bajar LDL sin medicación" },
];

/** Eventos "ocupados" del calendario personal de la doctora (Google Calendar simulado). */
export const MOCK_BUSY = [
  { day: 1, from: "11:00", to: "12:00", title: "Reunión personal" },
  { day: 3, from: "14:00", to: "15:30", title: "Congreso de nutrición (online)" },
  { day: 5, from: "09:00", to: "10:30", title: "Cita médica personal" },
];

/** PDF mínimo válido para los estudios de ejemplo. */
export function miniPdf(title: string) {
  const text = title.replace(/[()\\]/g, "");
  const content = `BT /F1 20 Tf 60 720 Td (${text}) Tj ET\nBT /F1 11 Tf 60 690 Td (Documento de ejemplo - modo demo) Tj ET`;
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(out);
}
