import Link from "next/link";
import { DeletePatientButton } from "@/components/admin/DeletePatientButton";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/data";

export default async function PatientsPage() {
  const user = await requirePermission("patients:read");
  const canDelete = user.permissions.has("appointments:delete");

  const patients = await db().listPatients();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl text-roseBrand-900">Pacientes</h1>
      <div className="overflow-x-auto rounded-2xl border border-roseBrand-200/60 bg-nude-50 p-4 shadow-bento">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-roseBrand-200 text-xs text-roseBrand-800/75">
            <tr>
              <th className="pb-2">Paciente</th><th className="pb-2">Contacto</th><th className="pb-2">Nacimiento</th>
              <th className="pb-2">Condiciones</th><th className="pb-2">Citas</th>{canDelete && <th className="pb-2 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-roseBrand-100">
            {patients.map((p) => (
              <tr key={p.id}>
                <td className="py-2.5 font-medium"><Link href={`/patients/${p.id}`} className="text-roseBrand-700 underline focus-visible:ring-2 focus-visible:ring-roseBrand-500 focus-visible:outline-none">{p.fullName}</Link></td>
                <td className="py-2.5">{p.email}<br /><span className="text-xs text-roseBrand-800/75">{p.phone}</span></td>
                <td className="py-2.5">{p.birthDate ?? "—"}</td>
                <td className="max-w-56 py-2.5 text-xs">{p.healthConditions ?? "—"}</td>
                <td className="py-2.5">{p.appointmentCount}</td>
                {canDelete && <td className="py-2.5 text-right"><DeletePatientButton id={p.id} name={p.fullName} /></td>}
              </tr>
            ))}
            {!patients.length && <tr><td colSpan={6} className="py-6 text-center text-roseBrand-800/75">Aún no hay pacientes.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
