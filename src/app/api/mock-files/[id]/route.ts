import { NextResponse } from "next/server";
import { mockFile } from "@/_mock/db";
import { getSessionUser } from "@/lib/auth";
import { isMock } from "@/lib/mode";

// Sirve los estudios de ejemplo del modo demo (en Supabase se usan URLs firmadas del bucket privado).
export async function GET(_req: Request, ctx: RouteContext<"/api/mock-files/[id]">) {
  if (!isMock()) return new NextResponse("Not found", { status: 404 });
  const user = await getSessionUser();
  if (!user?.permissions.has("appointments:read")) return new NextResponse("Unauthorized", { status: 401 });

  const f = mockFile((await ctx.params).id);
  if (!f) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(Buffer.from(f.bytes), {
    headers: { "Content-Type": f.mime, "Content-Disposition": `inline; filename="${encodeURIComponent(f.name)}"`, "Cache-Control": "private, no-store" },
  });
}
