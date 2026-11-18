import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUserContext, getFamilyMembers } from "@/lib/data";
import { FamilyClient } from "./family-client";
import { Skeleton } from "@/components/ui/skeleton";

export const instant = false;

export default function FamiliaPage() {
  return (
    <Suspense fallback={<FamiliaSkeleton />}>
      <FamiliaContent />
    </Suspense>
  );
}

function FamiliaSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-32" />
      <Skeleton className="h-64" />
    </div>
  );
}

async function FamiliaContent() {
  const ctx = await getUserContext();
  if (!ctx?.family) redirect("/bienvenida");

  const members = await getFamilyMembers(ctx.family.id);

  return (
    <FamilyClient
      familyName={ctx.family.name}
      inviteCode={ctx.family.invite_code}
      members={members}
    />
  );
}
