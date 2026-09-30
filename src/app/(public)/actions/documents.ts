"use server";

import { db } from "@/lib/data";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_DOCS_PER_APPOINTMENT = 10;
const ALLOWED: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
};

export type UploadResult = { ok: true; uploaded: number } | { ok: false; error: string };

// Firmas reales de archivo: no nos fiamos solo del mime que declara el navegador.
function matchesSignature(mime: string, b: Uint8Array) {
  const at = (s: string, o = 0) => [...s].every((c, i) => b[o + i] === c.charCodeAt(0));
  switch (mime) {
    case "application/pdf": return at("%PDF");
    case "image/png": return b[0] === 0x89 && at("PNG", 1);
    case "image/jpeg": return b[0] === 0xff && b[1] === 0xd8;
    case "image/webp": return at("RIFF") && at("WEBP", 8);
    case "image/heic": return at("ftyp", 4);
    default: return false;
  }
}

/** El token de la cita (enviado por correo) es la credencial: sin login para la paciente. */
export async function uploadDocuments(token: string, formData: FormData): Promise<UploadResult> {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return { ok: false, error: "Enlace inválido." };

  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { ok: false, error: "Selecciona al menos un archivo." };
  if (files.length > 3) return { ok: false, error: "Sube máximo 3 archivos por envío." };

  const appt = await db().getAppointmentByToken(token);
  if (!appt) return { ok: false, error: "Enlace inválido o cita no encontrada." };
  if (new Date(appt.endTime).getTime() < Date.now() - 30 * 86400_000) {
    return { ok: false, error: "Este enlace ya venció." };
  }

  if ((await db().countDocuments(appt.id)) + files.length > MAX_DOCS_PER_APPOINTMENT) {
    return { ok: false, error: `Máximo ${MAX_DOCS_PER_APPOINTMENT} archivos por cita.` };
  }

  let uploaded = 0;
  for (const file of files) {
    const ext = ALLOWED[file.type];
    if (!ext) return { ok: false, error: `“${file.name}”: solo se permiten PDF, JPG, PNG, WEBP o HEIC.` };
    if (file.size > MAX_FILE_BYTES) return { ok: false, error: `“${file.name}” supera los 10 MB.` };
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!matchesSignature(file.type, bytes)) return { ok: false, error: `“${file.name}” no parece un archivo válido.` };

    const saved = await db().addDocument({ id: appt.id, patientId: appt.patientId }, { name: file.name.slice(0, 255), mime: file.type, size: file.size, ext, bytes });
    if (!saved) return { ok: false, error: "No pudimos guardar el archivo. Intenta de nuevo." };
    uploaded++;
  }
  return { ok: true, uploaded };
}
