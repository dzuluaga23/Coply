import { redirect } from "next/navigation";
import { getUserContext } from "@/lib/data";

export const instant = false;

export default async function Home() {
  const ctx = await getUserContext();

  if (!ctx) redirect("/ingresar");
  if (!ctx.family) redirect("/bienvenida");
  redirect("/panel");
}
