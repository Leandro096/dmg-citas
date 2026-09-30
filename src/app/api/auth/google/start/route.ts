import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { setMockGoogleConnected } from "@/_mock/google";
import { GOOGLE_SCOPES, googleConfigured, oauthClient } from "@/lib/google";
import { isMock } from "@/lib/mode";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user?.permissions.has("settings:manage")) return NextResponse.redirect(new URL("/login", request.url));
  if (isMock()) {
    // Demo: simula el consentimiento de Google y vuelve a Configuración.
    setMockGoogleConnected(true);
    return NextResponse.redirect(new URL("/settings?google=connected", request.url));
  }
  if (!googleConfigured()) return NextResponse.redirect(new URL("/settings?google=error", request.url));

  const state = randomBytes(24).toString("hex");
  const url = oauthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // fuerza la entrega del refresh_token
    scope: GOOGLE_SCOPES,
    state,
  });
  const res = NextResponse.redirect(url);
  res.cookies.set("g_oauth_state", state, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/api/auth/google", maxAge: 600 });
  return res;
}
