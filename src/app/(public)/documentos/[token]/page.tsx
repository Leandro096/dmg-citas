import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UploadForm } from "@/components/booking/UploadForm";
import { DOCTOR, formatDateLong, formatTime } from "@/lib/booking";
import { db } from "@/lib/data";

export const metadata: Metadata = { title: "Subir estudios | Dra. Mirian Galán", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function DocumentosPage({ params }: PageProps<"/documentos/[token]">) {
  const { token } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(token)) notFound();

  const appt = await db().getAppointmentByToken(token);
  if (!appt) notFound();

  const local = new Date(new Date(appt.startTime).getTime() - 4 * 3600_000).toISOString();
  const name = appt.patientName.split(" ")[0];

  return (
    <main className="mx-auto w-full max-w-lg space-y-6 px-4 py-10">
      <div className="space-y-2 text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-roseBrand-700">{DOCTOR.name}</span>
        <h1 className="text-3xl text-roseBrand-900">Hola, {name}</h1>
        <p className="text-sm text-roseBrand-800/80">
          Sube tus analíticas o estudios médicos recientes para tu cita del{" "}
          <strong>{formatDateLong(local.slice(0, 10))}</strong> a las <strong>{formatTime(local.slice(11, 16))}</strong>.
        </p>
      </div>
      <div className="rounded-2xl border border-roseBrand-200/60 bg-nude-50 p-6 shadow-bento">
        <UploadForm token={token} />
      </div>
      <p className="text-center text-xs text-roseBrand-800/75">También puedes llevarlos impresos el día de tu cita.</p>
    </main>
  );
}
