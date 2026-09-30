import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MOCK_COOKIE, mockSessionUserId } from "@/_mock/session";
import { db, type PermissionCode, type Role } from "@/lib/data";
import { isMock } from "@/lib/mode";
import { supabaseSession } from "@/lib/supabase/session";

export type { PermissionCode };

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  permissions: Set<PermissionCode>;
};

/** Usuario autenticado + rol + permisos (RBAC), o null. Funciona con Supabase Auth o con la sesión demo. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  let userId: string | null = null;
  if (isMock()) {
    userId = mockSessionUserId((await cookies()).get(MOCK_COOKIE)?.value);
  } else {
    const { data } = await (await supabaseSession()).auth.getUser();
    userId = data.user?.id ?? null;
  }
  if (!userId) return null;

  const u = await db().getUser(userId);
  return u ? { ...u, permissions: new Set(u.permissions) } : null;
});

/** Para páginas: redirige a /login si no hay sesión y a /dashboard si falta permiso. */
export async function requirePermission(code: PermissionCode) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.permissions.has(code)) redirect("/dashboard");
  return user;
}

/** Para Server Actions / route handlers: lanza si no hay sesión o permiso. */
export async function assertPermission(code: PermissionCode) {
  const user = await getSessionUser();
  if (!user) throw new Error("No autenticado");
  if (!user.permissions.has(code)) throw new Error("No autorizado");
  return user;
}
