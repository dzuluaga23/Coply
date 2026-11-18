import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUserContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Envelope } from "@/lib/types";
import { EnvelopesClient } from "./bolsas-client";
import { Skeleton } from "@/components/ui/skeleton";

export const instant = false;

export default function BolsasPage() {
  return (
    <Suspense fallback={<BolsasSkeleton />}>
      <BolsasContent />
    </Suspense>
  );
}

function BolsasSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
      <Skeleton className="h-8 w-40" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}

async function BolsasContent() {
  const ctx = await getUserContext();
  if (!ctx?.family) redirect("/bienvenida");

  const supabase = await createClient();
  const { data: envelopes } = await supabase
    .from("envelopes")
    .select("*")
    .eq("family_id", ctx.family.id)
    .order("created_at", { ascending: true });

  return <EnvelopesClient initialEnvelopes={(envelopes ?? []) as Envelope[]} />;
}
