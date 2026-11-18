import { redirect } from "next/navigation";
import { getUserContext } from "@/lib/data";
import { WelcomeForms } from "./welcome-forms";

export const instant = false;

export default async function BienvenidaPage() {
  const ctx = await getUserContext();
  if (!ctx) redirect("/ingresar");
  if (ctx.family) redirect("/panel");

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-4 bg-muted/40">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold tracking-tight">
          ¡Hola{ctx.profile?.display_name ? `, ${ctx.profile.display_name}` : ""}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Un último paso: ¿vas a crear las cuentas de tu casa o te invitaron a un grupo?
        </p>
      </div>
      <WelcomeForms />
    </main>
  );
}
