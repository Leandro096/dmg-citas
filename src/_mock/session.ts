import { createHmac, timingSafeEqual } from "node:crypto";
import { MOCK_USERS } from "./data";

export const MOCK_COOKIE = "mock_session";
const secret = () => process.env.MOCK_SESSION_SECRET ?? "on-time-demo-secret";
const sign = (id: string) => createHmac("sha256", secret()).update(id).digest("hex");

/** Login demo: valida contra MOCK_USERS y devuelve el valor firmado de la cookie. */
export function mockLogin(email: string, password: string) {
  const u = MOCK_USERS.find((x) => x.email.toLowerCase() === email.toLowerCase() && x.password === password);
  return u ? `${u.id}.${sign(u.id)}` : null;
}

/** Devuelve el id de usuario si la cookie está bien firmada. */
export function mockSessionUserId(cookie: string | undefined) {
  if (!cookie) return null;
  const [id, sig] = cookie.split(".");
  if (!id || !sig) return null;
  const expected = Buffer.from(sign(id));
  const given = Buffer.from(sig);
  return given.length === expected.length && timingSafeEqual(given, expected) ? id : null;
}
