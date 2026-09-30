import Link from "next/link";
import { StaffBookingForm } from "@/components/admin/StaffBookingForm";
import { requirePermission } from "@/lib/auth";
import { getWorkingDays } from "@/lib/availability";
import { db } from "@/lib/data";

export default async function NewAppointmentPage({ searchParams }: PageProps<"/dashboard/new">) {
  await requirePermission("appointments:write");
  const sp = await searchParams;
  const initial = typeof sp.patient === "string" && /^[0-9a-f-]{36}$/i.test(sp.patient) ? sp.patient : undefined;

  const [list, workingDays] = await Promise.all([db().listPatients(), getWorkingDays()]);
  const patients = list.map((p) => ({ id: p.id, name: p.fullName, email: p.email }));

  return (
    <div className="space-y-4">
      <Link href="/dashboard" className="text-sm font-medium text-roseBrand-700 underline">← Citas</Link>
      <h1 className="text-3xl text-roseBrand-900">Nueva cita</h1>
      <StaffBookingForm patients={patients} workingDays={workingDays} initialPatientId={initial} />
    </div>
  );
}
