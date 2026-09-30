import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";
import { oauthClient } from "@/lib/google";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const back = (q: string) => {
    const res = NextResponse.redirect(new URL(`/settings?google=${q}`, request.url));
    res.cookies.delete({ name: "g_oauth_state", path: "/api/auth/google" });
    return res;
  };

  const user = await getSessionUser();
  if (!user?.permissions.has("settings:manage")) return NextResponse.redirect(new URL("/login", request.url));

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  if (!code || !state || state !== request.cookies.get("g_oauth_state")?.value) return back("error");

  try {
    const { tokens } = await oauthClient().getToken(code);
    if (!tokens.access_token || !tokens.refresh_token) return back("error");

    const db = supabaseAdmin();
    await db.from("doctor_oauth_tokens").delete().eq("provider", "google");
    const { error } = await db.from("doctor_oauth_tokens").insert({
      user_id: user.id,
      provider: "google",
      access_token: encrypt(tokens.access_token),
      refresh_token: encrypt(tokens.refresh_token), // encriptado en reposo
      token_expires_at: new Date(tokens.expiry_date ?? Date.now() + 3500_000).toISOString(),
    });
    if (error) throw error;
    return back("connected");
  } catch (e) {
    console.error("[google callback]", e);
    return back("error");
  }
}
