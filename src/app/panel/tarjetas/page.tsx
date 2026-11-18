import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUserContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { CardPayment, CardPurchase } from "@/lib/types";
import {
  buildSchedule,
  currentMonthKey,
  monthLabel,
  remainingInstallments,
} from "@/lib/cards";
import { CardsClient } from "./cards-client";
import { Skeleton } from "@/components/ui/skeleton";

export const instant = false;

export default function TarjetasPage() {
  return (
    <Suspense fallback={<TarjetasSkeleton />}>
      <TarjetasContent />
    </Suspense>
  );
}

function TarjetasSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
      <Skeleton className="h-8 w-40" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
      </div>
    </div>
  );
}

async function TarjetasContent() {
  const ctx = await getUserContext();
  if (!ctx?.family) redirect("/bienvenida");

  const supabase = await createClient();
  const [{ data: cards }, { data: purchases }, { data: payments }] =
    await Promise.all([
      supabase.from("cards").select("*").eq("family_id", ctx.family.id).order("created_at"),
      supabase.from("card_purchases").select("*").eq("family_id", ctx.family.id),
      supabase.from("card_payments").select("*").eq("family_id", ctx.family.id),
    ]);

  const allPurchases = (purchases ?? []) as CardPurchase[];
  const allPayments = (payments ?? []) as CardPayment[];
  const today = currentMonthKey();

  const summaries = ((cards ?? []) as Array<{
    id: string;
    name: string;
    cutoff_day: number;
    credit_limit: number;
    color: string;
  }>).map((c) => {
    const cardPurchases = allPurchases.filter((p) => p.card_id === c.id);
    const cardPayments = allPayments.filter((p) => p.card_id === c.id);

    const totalDebt = cardPurchases.reduce((s, p) => s + Number(p.total_amount), 0);
    const paid = cardPayments.reduce((s, p) => s + Number(p.amount), 0);
    const remaining = Math.max(totalDebt - paid, 0);

    // El próximo corte con cuotas por pagar, empezando por el mes actual
    const schedule = buildSchedule(cardPurchases, 6);
    const upcoming = schedule.find((s) => s.due > 0);

    return {
      id: c.id,
      name: c.name,
      cutoff_day: c.cutoff_day,
      credit_limit: Number(c.credit_limit),
      color: c.color,
      totalDebt,
      paid,
      remaining,
      nextMonthDue: upcoming?.due ?? 0,
      nextMonthLabel: upcoming ? monthLabel(upcoming.month) : monthLabel(today),
      purchasesCount: cardPurchases.filter((p) => remainingInstallments(p, today) > 0).length,
    };
  });

  return <CardsClient cards={summaries} />;}
