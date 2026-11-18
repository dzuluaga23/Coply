import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUserContext, getFamilyMembers } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { DianClient, type MemberDian } from "./dian-client";
import { Skeleton } from "@/components/ui/skeleton";

export const instant = false;

export default function DianPage() {
  return (
    <Suspense fallback={<DianSkeleton />}>
      <DianContent />
    </Suspense>
  );
}

function DianSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-24" />
      <Skeleton className="h-64" />
    </div>
  );
}

async function DianContent() {
  const ctx = await getUserContext();
  if (!ctx?.family) redirect("/bienvenida");

  const today = new Date();
  const year = today.getFullYear();
  const elapsedMonths = year === today.getFullYear() ? today.getMonth() + 1 : 12;

  const supabase = await createClient();
  const members = await getFamilyMembers(ctx.family.id);

  const [{ data: txs }, { data: purchases }, { data: dianRows }] =
    await Promise.all([
      supabase
        .from("transactions")
        .select("kind, amount, created_by")
        .eq("family_id", ctx.family.id)
        .gte("occurred_at", `${year}-01-01`)
        .lte("occurred_at", `${year}-12-31`),
      supabase
        .from("card_purchases")
        .select("total_amount, created_by")
        .eq("family_id", ctx.family.id)
        .gte("first_month", `${year}-01-01`)
        .lte("first_month", `${year}-12-31`),
      supabase
        .from("dian_data")
        .select("*")
        .eq("family_id", ctx.family.id)
        .eq("year", year),
    ]);

  const transactions = (txs ?? []) as Array<{
    kind: "gasto" | "ingreso";
    amount: string | number;
    created_by: string;
  }>;
  const cardPurchases = (purchases ?? []) as Array<{
    total_amount: string | number;
    created_by: string;
  }>;
  const dianList = (dianRows ?? []) as unknown as Array<{
    profile_id: string;
    patrimonio_bruto: string | number;
    extra_ingresos: string | number;
    extra_tarjeta: string | number;
    extra_compras: string | number;
    extra_consignaciones: string | number;
  }>;

  const dataByProfile = new Map(dianList.map((d) => [d.profile_id, d]));

  const memberData: MemberDian[] = members.map((m) => {
    const d = dataByProfile.get(m.profile.id);
    const num = (v: string | number | undefined) => Number(v ?? 0);

    // Ingresos: ingresos registrados en movimientos + extras manuales
    const ingresosApp = transactions
      .filter((t) => t.created_by === m.user_id && t.kind === "ingreso")
      .reduce((s, t) => s + Number(t.amount), 0);

    // Consumos con tarjeta: compras de la persona en el año (valor total difierido)
    const tarjetaApp = cardPurchases
      .filter((p) => p.created_by === m.user_id)
      .reduce((s, p) => s + Number(p.total_amount), 0);

    // Compras y consumos: gastos de movimientos + compras con tarjeta
    const gastosApp = transactions
      .filter((t) => t.created_by === m.user_id && t.kind === "gasto")
      .reduce((s, t) => s + Number(t.amount), 0);

    // Consignaciones: aproximamos con los ingresos registrados
    // (consignar a una cuenta ≈ dinero que entró). Se ajusta con extras.
    const consignacionesApp = ingresosApp;

    return {
      profile_id: m.profile.id,
      name: m.profile.display_name,
      role: m.role,
      year,
      elapsedMonths,
      ingresos: ingresosApp + num(d?.extra_ingresos),
      tarjeta: tarjetaApp + num(d?.extra_tarjeta),
      compras: gastosApp + tarjetaApp + num(d?.extra_compras),
      consignaciones: consignacionesApp + num(d?.extra_consignaciones),
      patrimonio: num(d?.patrimonio_bruto),
      extras: {
        patrimonio: num(d?.patrimonio_bruto),
        ingresos: num(d?.extra_ingresos),
        tarjeta: num(d?.extra_tarjeta),
        compras: num(d?.extra_compras),
        consignaciones: num(d?.extra_consignaciones),
      },
      autos: {
        ingresos: ingresosApp,
        tarjeta: tarjetaApp,
        compras: gastosApp + tarjetaApp,
        consignaciones: consignacionesApp,
      },
    };
  });

  return (
    <DianClient
      year={year}
      elapsedMonths={elapsedMonths}
      members={memberData}
      familyId={ctx.family.id}
    />
  );
}
