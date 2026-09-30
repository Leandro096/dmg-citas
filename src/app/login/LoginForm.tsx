"use client";

import { useActionState } from "react";
import { Icon } from "@/components/ui/Icon";
import { login, type LoginState } from "./actions";

const input =
  "w-full rounded-xl border border-roseBrand-200 bg-white py-2.5 pl-9 pr-3 text-sm text-roseBrand-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-roseBrand-500";

export type DemoAccount = { label: string; email: string; password: string };

export function LoginForm({ demo }: { demo?: DemoAccount[] }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-roseBrand-200/60 bg-nude-50 p-6 shadow-bento">
      <div className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-roseBrand-100 text-2xl text-roseBrand-700">
          <Icon icon="lucide:lock-keyhole" />
        </div>
        <h1 className="text-2xl text-roseBrand-900">Acceso al panel</h1>
        <p className="text-xs text-roseBrand-800/80">Solo para la doctora y su asistente.</p>
      </div>
      <div className="relative">
        <Icon icon="lucide:mail" className="pointer-events-none absolute left-3 top-3.5 text-roseBrand-700/70" />
        <input id="login-email" name="email" type="email" required autoComplete="email" aria-label="Correo" placeholder="Correo" className={input} />
      </div>
      <div className="relative">
        <Icon icon="lucide:key-round" className="pointer-events-none absolute left-3 top-3.5 text-roseBrand-700/70" />
        <input id="login-password" name="password" type="password" required autoComplete="current-password" aria-label="Contraseña" placeholder="Contraseña" className={input} />
      </div>
      {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      <button type="submit" disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-roseBrand-700 py-2.5 font-semibold text-white shadow-md transition-colors hover:bg-roseBrand-800 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-roseBrand-500 focus-visible:ring-offset-2 focus-visible:outline-none">
        {pending ? "Entrando…" : "Entrar"}
      </button>

      {demo && (
        <div className="space-y-2 rounded-xl border border-dashed border-roseBrand-200 bg-white p-3 text-xs text-roseBrand-800/80">
          <p className="font-semibold text-roseBrand-900">Modo demo · cuentas de ejemplo</p>
          {demo.map((d) => (
            <button key={d.email} type="button"
              onClick={() => {
                (document.getElementById("login-email") as HTMLInputElement).value = d.email;
                (document.getElementById("login-password") as HTMLInputElement).value = d.password;
              }}
              className="flex w-full flex-col rounded-lg border border-roseBrand-100 px-3 py-2 text-left transition-colors hover:border-roseBrand-500 focus-visible:ring-2 focus-visible:ring-roseBrand-500 focus-visible:outline-none">
              <span className="font-medium text-roseBrand-900">{d.label}</span>
              <span>{d.email} · {d.password}</span>
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
