"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import { deletePatient } from "@/app/(admin)/actions/appointments";

export function DeletePatientButton({ id, name }: { id: string; name: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <button type="button" disabled={pending} aria-label={`Eliminar a ${name}`}
        onClick={() => {
          if (!window.confirm(`¿Eliminar a ${name}? También se ocultarán sus citas.`)) return;
          start(async () => {
            const r = await deletePatient(id);
            if (!r.ok) setError(r.error);
          });
        }}
        className="rounded p-1 text-red-500 hover:bg-red-50 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-roseBrand-500 focus-visible:outline-none">
        <Icon icon="lucide:trash-2" />
      </button>
      {error && <span role="alert" className="text-xs text-red-700">{error}</span>}
    </>
  );
}
