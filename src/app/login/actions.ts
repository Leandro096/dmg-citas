"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MOCK_COOKIE, mockLogin } from "@/_mock/session";
import { db } from "@/lib/data";
import { isMock } from "@/lib/mode";
import { supabaseSession } from "@/lib/supabase/session";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Ingresa tu correo y contraseña." };

  if (isMock()) {
    const value = mockLogin(email, password);
    if (!value) return { error: "Correo o contraseña incorrectos." };
    (await cookies()).set(MOCK_COOKIE, value, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
    redirect("/dashboard");
  }

  const session = await supabaseSession();
  const { data, error } = await session.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "Correo o contraseña incorrectos." };

  // Además de existir en Auth, debe ser un usuario activo con rol en `users`.
  if (!(await db().getUser(data.user.id))) {
    await session.auth.signOut();
    return { error: "Tu cuenta no tiene acceso al panel." };
  }
  redirect("/dashboard");
}

export async function logout() {
  if (isMock()) (await cookies()).delete(MOCK_COOKIE);
  else await (await supabaseSession()).auth.signOut();
  redirect("/login");
}
