// Crea un usuario del panel (DOCTOR o ASSISTANT).
// Uso: node --env-file=.env.local scripts/create-user.mjs <email> <contraseña> "<Nombre completo>" <DOCTOR|ASSISTANT>
import { createClient } from "@supabase/supabase-js";

const [email, password, fullName, role] = process.argv.slice(2);
if (!email || !password || !fullName || !["DOCTOR", "ASSISTANT"].includes(role)) {
  console.error('Uso: node --env-file=.env.local scripts/create-user.mjs <email> <contraseña> "<Nombre>" <DOCTOR|ASSISTANT>');
  process.exit(1);
}
if (password.length < 10) {
  console.error("La contraseña debe tener al menos 10 caracteres.");
  process.exit(1);
}

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data: roleRow, error: roleErr } = await db.from("roles").select("id").eq("name", role).single();
if (roleErr) throw roleErr;

const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
if (error) throw error;

const { error: insErr } = await db.from("users").insert({ id: data.user.id, role_id: roleRow.id, email, full_name: fullName });
if (insErr) {
  await db.auth.admin.deleteUser(data.user.id);
  throw insErr;
}
console.log(`Usuario ${role} creado: ${email}`);
