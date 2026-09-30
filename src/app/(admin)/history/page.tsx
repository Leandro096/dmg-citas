import Link from "next/link";
import { AppointmentCard } from "@/components/admin/AppointmentCard";
import { requirePermission } from "@/lib/auth";
import { loadAppointments } from "@/lib/appointments-view";

const PAGE = 25;
const STATUSES = ["CONFIRMED", "COMPLETED", "CANCELLED"] as const;
const field = "rounded-xl border border-roseBrand-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-roseBrand-500";

const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
const isDate = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);

export default async function HistoryPage({ searchParams }: PageProps<"/history">) {
  const user = await requirePermission("appointments:read");
  const sp = await searchParams;
  const q = str(sp.q)?.slice(0, 80) || undefined;
  const status = STATUSES.find((s) => s === str(sp.status));
  const from = isDate(str(sp.from));
  const to = isDate(str(sp.to));
  const page = Math.max(1, Number(str(sp.page)) || 1);

  const { rows, total } = await loadAppointments({ q, status, from, to, ascending: false, limit: PAGE, offset: (page - 1) * PAGE });
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const href = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q); if (status) u.set("status", status); if (from) u.set("from", from); if (to) u.set("to", to);
    u.set("page", String(p));
    return `/history?${u}`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl text-roseBrand-900">Historial de citas</h1>

      <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-roseBrand-200/60 bg-nude-50 p-4 shadow-bento">
        <label className="flex flex-col gap-1 text-xs font-medium text-roseBrand-800/80">Paciente
          <input name="q" defaultValue={q} placeholder="Nombre" className={field} /></label>
        <label className="flex flex-col gap-1 text-xs font-medium text-roseBrand-800/80">Estado
          <select name="status" defaultValue={status ?? ""} className={field}>
            <option value="">Todos</option>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select></label>
        <label className="flex flex-col gap-1 text-xs font-medium text-roseBrand-800/80">Desde
          <input type="date" name="from" defaultValue={from} className={field} /></label>
        <label className="flex flex-col gap-1 text-xs font-medium text-roseBrand-800/80">Hasta
          <input type="date" name="to" defaultValue={to} className={field} /></label>
        <button className="rounded-xl bg-roseBrand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-roseBrand-800 focus-visible:ring-2 focus-visible:ring-roseBrand-500 focus-visible:ring-offset-2 focus-visible:outline-none">Filtrar</button>
      </form>

      <p className="text-sm text-roseBrand-800/80">{total} cita(s)</p>
      <section className="space-y-3" aria-label="Resultados">
        {rows.map((a) => <AppointmentCard key={a.id} a={a} canWrite={user.permissions.has("appointments:write")} canDelete={user.permissions.has("appointments:delete")} />)}
        {!rows.length && <p className="text-sm text-roseBrand-800/80">No hay citas con esos filtros.</p>}
      </section>

      {pages > 1 && (
        <nav className="flex items-center justify-between text-sm" aria-label="Paginación">
          {page > 1 ? <Link href={href(page - 1)} className="font-medium text-roseBrand-700 underline">← Anterior</Link> : <span />}
          <span className="text-roseBrand-800/80">Página {page} de {pages}</span>
          {page < pages ? <Link href={href(page + 1)} className="font-medium text-roseBrand-700 underline">Siguiente →</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
