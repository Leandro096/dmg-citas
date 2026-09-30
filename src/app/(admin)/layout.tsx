import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { getSessionUser } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import { isMock } from "@/lib/mode";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const links = [
    { href: "/dashboard", label: "Citas", icon: "lucide:calendar-check", show: user.permissions.has("appointments:read") },
    { href: "/history", label: "Historial", icon: "lucide:history", show: user.permissions.has("appointments:read") },
    { href: "/patients", label: "Pacientes", icon: "lucide:users", show: user.permissions.has("patients:read") },
    { href: "/settings", label: "Configuración", icon: "lucide:settings", show: user.permissions.has("settings:manage") },
  ].filter((l) => l.show);

  return (
    <>
      {isMock() && (
        <p className="bg-roseBrand-800 px-4 py-1.5 text-center text-xs text-white">
          Modo demo: datos de ejemplo en memoria (se reinician al reiniciar el servidor).
        </p>
      )}
      <header className="border-b border-roseBrand-200/60 bg-nude-50">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
          <nav className="flex items-center gap-1" aria-label="Panel">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-roseBrand-800 transition-colors hover:bg-roseBrand-100 focus-visible:ring-2 focus-visible:ring-roseBrand-500 focus-visible:outline-none">
                <Icon icon={l.icon} className="text-roseBrand-700" /> {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-xs">
            <span className="rounded-full bg-roseBrand-100 px-2.5 py-1 font-medium text-roseBrand-800">{user.fullName} · {user.role}</span>
            <form action={logout}>
              <button className="flex items-center gap-1 text-roseBrand-700 hover:underline focus-visible:ring-2 focus-visible:ring-roseBrand-500 focus-visible:outline-none"><Icon icon="lucide:log-out" /> Salir</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-8">{children}</main>
    </>
  );
}
