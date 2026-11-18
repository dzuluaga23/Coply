import { redirect } from "next/navigation";
import { getUserContext } from "@/lib/data";
import { AuthForm } from "./auth-form";

export const instant = false;

export default async function IngresarPage() {
  // Si ya tiene sesión, no necesita esta página
  const ctx = await getUserContext();
  if (ctx) redirect(ctx.family ? "/panel" : "/bienvenida");

  return (
    <main className="flex min-h-svh flex-col items-center justify-center p-4 bg-muted/40">
      <AuthForm />
    </main>
  );
}
