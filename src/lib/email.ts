import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { isMock } from "@/lib/mode";
import { DOCTOR, formatDateLong, formatTime, type AppointmentType } from "@/lib/booking";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/**
 * Correo de confirmación vía Resend con la guía de preparación (PDF) adjunta
 * y el enlace para subir analíticas/estudios. Sin RESEND_API_KEY solo registra en consola.
 */
export async function sendBookingEmail(p: {
  to: string;
  name: string;
  date: string;
  time: string;
  type: AppointmentType;
  meetLink?: string;
  uploadUrl: string;
}) {
  const key = process.env.RESEND_API_KEY;
  if (isMock() || !key) {
    if (isMock()) console.info(`[demo] Correo a ${p.to}: cita ${p.date} ${p.time}. Adjunta guía PDF. Enlace de estudios: ${p.uploadUrl}`);
    else
    console.warn("[email] RESEND_API_KEY no configurada; no se envió correo a", p.to);
    return false;
  }

  const pdf = await readFile(path.join(process.cwd(), "src", "assets", "guia-preparacion.pdf"));
  const where =
    p.type === "PRESENCIAL"
      ? `${esc(DOCTOR.address)}`
      : p.meetLink
        ? `Videollamada: <a href="${esc(p.meetLink)}">${esc(p.meetLink)}</a>`
        : "Videollamada por Google Meet (el enlace llegará en la invitación de calendario)";

  const html = `
  <div style="font-family:Arial,sans-serif;color:#5a2d38;max-width:520px;margin:auto">
    <h2 style="color:#3d1c24">¡Cita confirmada, ${esc(p.name.split(" ")[0])}!</h2>
    <p><strong>${esc(formatDateLong(p.date))}</strong> a las <strong>${esc(formatTime(p.time))}</strong><br>${where}</p>
    <p>Adjuntamos la <strong>guía de preparación</strong> para tu evaluación nutricional.</p>
    <p>Si tienes analíticas o estudios recientes (PDF o imágenes), puedes subirlos antes de tu cita aquí:</p>
    <p><a href="${esc(p.uploadUrl)}" style="background:#c87a8e;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none">Subir mis estudios</a></p>
    <p style="font-size:12px;color:#8a6a72">${esc(DOCTOR.name)} · ${esc(DOCTOR.title)}</p>
  </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? `${DOCTOR.name} <onboarding@resend.dev>`,
      to: [p.to],
      subject: `Cita confirmada: ${formatDateLong(p.date)}, ${formatTime(p.time)}`,
      html,
      attachments: [{ filename: "Guia-de-preparacion.pdf", content: pdf.toString("base64") }],
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return true;
}
