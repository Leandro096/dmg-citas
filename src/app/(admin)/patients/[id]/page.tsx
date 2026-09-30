import Link from "next/link";
import { notFound } from "next/navigation";
import { AppointmentCard } from "@/components/admin/AppointmentCard";
import { requirePermission } from "@/lib/auth";
import { loadAppointments } from "@/lib/appointments-view";
import { db } from "@/lib/data";

export default async function PatientDetailPage({ params }: PageProps<"/patients/[id]">) {
  const user = await requirePermission("patients:read");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const p = await db().getPatient(id);
  if (!p) notFound();

  const { rows } = await loadAppointments({ patientId: id, ascending: false, limit: 200 });
  const done = rows.filter((r) => r.status === "COMPLETED").length;
  const canWrite = user.permissions.has("appointments:write");

  return (
    <div className="space-y-6">
      <Link href="/patients" className="text-sm font-medium text-roseBrand-700 underline">← Pacientes</Link>
      <div className="rounded-2xl border border-roseBrand-200/60 bg-nude-50 p-6 shadow-bento">
        <h1 className="text-3xl text-roseBrand-900">{p.fullName}</h1>
        <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <Item k="Correo" v={p.email} />
          <Item k="WhatsApp" v={p.phone} />
          <Item k="Nacimiento" v={p.birthDate ?? "—"} />
          <Item k="Cédula" v={p.identificationId ?? "—"} />
          <Item k="Condiciones de salud" v={p.healthConditions ?? "—"} />
          <Item k="Citas" v={`${rows.length} en total · ${done} completadas`} />
        </dl>
        {canWrite && (
          <Link href={`/dashboard/new?patient=${p.id}`} className="mt-5 inline-flex rounded-xl bg-roseBrand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-roseBrand-800 focus-visible:ring-2 focus-visible:ring-roseBrand-500 focus-visible:ring-offset-2 focus-visible:outline-none">
            Agendar nueva cita
          </Link>
        )}
      </div>

      <section className="space-y-3" aria-labelledby="hist">
        <h2 id="hist" className="text-2xl text-roseBrand-900">Historial de citas</h2>
        {rows.map((a) => <AppointmentCard key={a.id} a={a} canWrite={canWrite} canDelete={user.permissions.has("appointments:delete")} />)}
        {!rows.length && <p className="text-sm text-roseBrand-800/80">Aún no tiene citas.</p>}
      </section>
    </div>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-roseBrand-800/75">{k}</dt>
      <dd className="whitespace-pre-line">{v}</dd>
    </div>
  );
}
