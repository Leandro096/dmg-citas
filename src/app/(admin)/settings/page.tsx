import { Icon } from "@/components/ui/Icon";
import { WorkingHoursForm } from "@/components/admin/WorkingHoursForm";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/data";
import { googleAvailable, isGoogleConnected } from "@/lib/google";
import { disconnectGoogle } from "../actions/settings";

const card = "rounded-2xl border border-roseBrand-200/60 bg-nude-50 p-6 shadow-bento";

export default async function SettingsPage({ searchParams }: PageProps<"/settings">) {
  await requirePermission("settings:manage");
  const sp = await searchParams;
  const flash = typeof sp.google === "string" ? sp.google : null;

  const initial = await db().getWorkingHours();
  const configured = googleAvailable();
  const connected = await isGoogleConnected();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl text-roseBrand-900">Configuración</h1>

      <section className={card} aria-labelledby="gcal">
        <h2 id="gcal" className="mb-2 flex items-center gap-2 text-xl text-roseBrand-900"><Icon icon="logos:google-calendar" /> Google Calendar</h2>
        {flash === "connected" && <p role="status" className="mb-2 text-sm text-emerald-700">Cuenta conectada correctamente.</p>}
        {flash === "error" && <p role="alert" className="mb-2 text-sm text-red-700">No se pudo conectar la cuenta de Google. Intenta de nuevo.</p>}
        {!configured ? (
          <p className="text-sm text-roseBrand-800/80">Faltan las variables GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET y GOOGLE_REDIRECT_URI.</p>
        ) : connected ? (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="flex items-center gap-1 text-emerald-700"><Icon icon="lucide:check-circle-2" /> Conectado: la disponibilidad y las citas se sincronizan con tu calendario.</span>
            <form action={disconnectGoogle}><button className="text-xs font-medium text-red-700 hover:underline focus-visible:ring-2 focus-visible:ring-roseBrand-500 focus-visible:outline-none">Desconectar</button></form>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <p className="text-roseBrand-800/80">Conecta tu cuenta para bloquear horarios ocupados y crear los eventos (con Google Meet en citas virtuales).</p>
            <a href="/api/auth/google/start" className="inline-flex items-center gap-2 rounded-xl bg-roseBrand-700 px-4 py-2 font-semibold text-white shadow-md transition-colors hover:bg-roseBrand-800 focus-visible:ring-2 focus-visible:ring-roseBrand-500 focus-visible:ring-offset-2 focus-visible:outline-none">
              <Icon icon="lucide:link" /> Conectar Google Calendar
            </a>
          </div>
        )}
      </section>

      <section className={card} aria-labelledby="horario">
        <h2 id="horario" className="mb-3 flex items-center gap-2 text-xl text-roseBrand-900"><Icon icon="lucide:clock" className="text-roseBrand-700" /> Horario de atención</h2>
        <WorkingHoursForm initial={initial} />
      </section>
    </div>
  );
}
