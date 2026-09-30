/**
 * Modo demo: se usa cuando Supabase no está configurado (o con USE_MOCK=1).
 * Todos los datos vienen de `src/_mock` y viven en memoria (se reinician con el servidor).
 */
export function isMock() {
  if (process.env.USE_MOCK === "1") return true;
  return !(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
