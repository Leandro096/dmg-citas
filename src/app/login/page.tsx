import { MOCK_USERS } from "@/_mock/data";
import { isMock } from "@/lib/mode";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const demo = isMock() ? MOCK_USERS.map((u) => ({ label: `${u.fullName} (${u.role})`, email: u.email, password: u.password })) : undefined;
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10">
      <LoginForm demo={demo} />
    </main>
  );
}
