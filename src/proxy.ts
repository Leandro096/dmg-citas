import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isMock } from "@/lib/mode";

// Refresca la sesión de Supabase y bloquea el área admin sin sesión.
// El control de permisos (RBAC) y la validación de la sesión demo se hacen en lib/auth.ts.
export async function proxy(request: NextRequest) {
  const toLogin = () => {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  };

  if (isMock()) {
    return request.cookies.get("mock_session") ? NextResponse.next() : toLogin();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  return data.user ? response : toLogin();
}

export const config = {
  matcher: ["/dashboard/:path*", "/patients/:path*", "/history/:path*", "/settings/:path*"],
};
