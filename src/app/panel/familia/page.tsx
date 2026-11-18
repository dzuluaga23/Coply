import { redirect } from "next/navigation";
import { getUserContext, getFamilyMembers } from "@/lib/data";
import { FamilyClient } from "./family-client";

export const instant = false;

export default async function FamiliaPage() {
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
