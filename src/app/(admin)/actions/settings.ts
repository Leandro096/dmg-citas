"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { setMockGoogleConnected } from "@/_mock/google";
import { assertPermission } from "@/lib/auth";
import { db, type WorkingBlock } from "@/lib/data";
import { isMock } from "@/lib/mode";
import { supabaseAdmin } from "@/lib/supabase/server";

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const blocksSchema = z
  .array(z.object({ day: z.number().int().min(0).max(6), start: hhmm, end: hhmm }))
  .max(60)
  .refine((b) => b.every((x) => x.start < x.end), "La hora de inicio debe ser anterior a la de fin")
  .refine((b) => {
    const byDay = new Map<number, typeof b>();
    b.forEach((x) => byDay.set(x.day, [...(byDay.get(x.day) ?? []), x]));
    return [...byDay.values()].every((list) => {
      const s = [...list].sort((p, q) => p.start.localeCompare(q.start));
      return s.every((x, i) => i === 0 || s[i - 1].end <= x.start);
    });
  }, "Hay bloques que se solapan en un mismo día");

export async function saveWorkingHours(blocks: WorkingBlock[]): Promise<{ ok: true } | { ok: false; error: string }> {
  await assertPermission("settings:manage");
  const parsed = blocksSchema.safeParse(blocks);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  if (!(await db().saveWorkingHours(parsed.data))) return { ok: false, error: "No se pudo guardar el horario." };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function disconnectGoogle(): Promise<void> {
  await assertPermission("settings:manage");
  if (isMock()) setMockGoogleConnected(false);
  else await supabaseAdmin().from("doctor_oauth_tokens").delete().eq("provider", "google");
  revalidatePath("/settings");
}
