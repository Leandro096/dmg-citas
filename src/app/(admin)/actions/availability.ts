"use server";

import { assertPermission } from "@/lib/auth";
import { getSlots } from "@/lib/availability";
import type { Slot } from "@/lib/booking";

/** Horarios libres de un día (solo personal con permiso para crear citas). */
export async function getAvailability(date: string): Promise<Slot[]> {
  await assertPermission("appointments:write");
  return getSlots(date);
}
