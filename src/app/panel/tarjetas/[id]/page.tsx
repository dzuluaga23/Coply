import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUserContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { CardPayment, CardPurchase } from "@/lib/types";
import { buildSchedule, purchaseTotalWithInterest } from "@/lib/cards";
import { CardDetailClient } from "./card-detail-client";
import { Skeleton } from "@/components/ui/skeleton";

export const instant = false;

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getUserContext();
  if (!ctx?.family) redirect("/bienvenida");

  const supabase = await createClient();

  const { data: card } = await supabase
    .from("cards")
    .select("*")
    .eq("id", id)
    .eq("family_id", ctx.family.id)
    .maybeSingle();

  if (!card) redirect("/panel/tarjetas");

  const [{ data: purchases }, { data: payments }] = await Promise.all([
    supabase
      .from("card_purchases")
      .select("*, profile:profiles (display_name)")
      .eq("card_id", id)
      .order("first_month"),
    supabase
      .from("card_payments")
      .select("*, profile:profiles (display_name)")
      .eq("card_id", id)
      .order("paid_at", { ascending: false }),
  ]);

  const cardPurchases = (purchases ?? []) as unknown as (CardPurchase & {
    profile?: { display_name: string } | null;
  })[];
  const cardPayments = (payments ?? []) as unknown as (CardPayment & {
    profile?: { display_name: string } | null;
  })[];

  const totalDebt = cardPurchases.reduce((s, p) => s + purchaseTotalWithInterest(p), 0);
  const paid = cardPayments.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <Suspense fallback={<Skeleton className="m-8 h-96" />}>
      <CardDetailClient
        card={{
          id: card.id,
          name: card.name,
          cutoff_day: card.cutoff_day,
          credit_limit: Number(card.credit_limit),
          color: card.color,
          franchise: card.franchise,
          issuer: card.issuer,
          card_type: card.card_type,
          tier: card.tier,
          last4: card.last4,
        }}
        purchases={cardPurchases}
        payments={cardPayments}
        schedule={buildSchedule(cardPurchases, 8)}
        totalDebt={totalDebt}
        paid={paid}
      />
    </Suspense>
  );
}
