import Link from "next/link";
import { AppointmentCard } from "@/components/admin/AppointmentCard";
import { Icon } from "@/components/ui/Icon";
import { requirePermission } from "@/lib/auth";
import { currentTime, loadAppointments } from "@/lib/appointments-view";

export default async function DashboardPage() {
  const user = await requirePermission("appointments:read");
  const canWrite = user.permissions.has("appointments:write");
  const canDelete = user.permissions.has("appointments:delete");

  const { rows } = await loadAppointments({ status: "CONFIRMED", limit: 200 });
  const cutoff = currentTime() - 3600_000;
  const upcoming = rows.filter((r) => r.ts >= cutoff);
  const pending = rows.filter((r) => r.ts < cutoff); // confirmadas ya pasadas: falta marcarlas completadas

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl text-roseBrand-900">Próximas citas</h1>
        {canWrite && (
          <Link href="/dashboard/new" className="inline-flex items-center gap-2 rounded-xl bg-roseBrand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-roseBrand-800 focus-visible:ring-2 focus-visible:ring-roseBrand-500 focus-visible:ring-offset-2 focus-visible:outline-none">
            <Icon icon="lucide:calendar-plus" /> Nueva cita
          </Link>
        )}
      </div>

      <section className="space-y-3" aria-label="Próximas">
        {upcoming.length ? upcoming.map((a) => <AppointmentCard key={a.id} a={a} canWrite={canWrite} canDelete={canDelete} />) : <p className="text-sm text-roseBrand-800/80">No hay citas próximas.</p>}
      </section>

      {pending.length > 0 && (
        <section className="space-y-3" aria-labelledby="por-cerrar">
          <h2 id="por-cerrar" className="text-2xl text-roseBrand-900">Por cerrar</h2>
          <p className="text-sm text-roseBrand-800/80">Citas que ya pasaron y siguen confirmadas. Márcalas como completadas o cancélalas.</p>
          {pending.reverse().map((a) => <AppointmentCard key={a.id} a={a} canWrite={canWrite} canDelete={canDelete} />)}
        </section>
      )}

      <p className="text-sm"><Link href="/history" className="font-medium text-roseBrand-700 underline">Ver historial completo de citas →</Link></p>
    </div>
  );
}
