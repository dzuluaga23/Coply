import { getUserContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Category, TransactionWithMeta } from "@/lib/types";
import { MovementsClient } from "./movements-client";

export const instant = false;

export default async function MovimientosPage() {
  const ctx = await getUserContext();
  if (!ctx?.family) return null;

  const supabase = await createClient();

  const [{ data: rawTx }, { data: categories }] = await Promise.all([
    supabase
      .from("transactions")
      .select(
        `*, category:categories (name, color), profile:profiles (display_name)`
      )
      .eq("family_id", ctx.family.id)
      .order("occurred_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("categories")
      .select("*")
      .eq("family_id", ctx.family.id)
      .order("kind")
      .order("name"),
  ]);

  return (
    <MovementsClient
      initialTransactions={(rawTx ?? []) as unknown as TransactionWithMeta[]}
      categories={(categories ?? []) as Category[]}
    />
  );
}
