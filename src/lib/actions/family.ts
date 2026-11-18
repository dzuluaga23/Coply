"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/** Genera un código de invitación de 6 caracteres, sin letras confusas. */
function generateInviteCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export interface ActionResult {
  error?: string;
}

/** Crea una nueva familia y deja al usuario como dueño. */
export async function createFamily(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) {
    return { error: "Escribe el nombre de tu familia (mínimo 2 letras)." };
  }

  // Verificar que no pertenezca ya a una familia
  const { data: existing } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) redirect("/panel");

  // Buscar un código único
  let inviteCode = generateInviteCode();
  for (let i = 0; i < 5; i++) {
    const { data: clash } = await supabase
      .from("families")
      .select("id")
      .eq("invite_code", inviteCode)
      .maybeSingle();
    if (!clash) break;
    inviteCode = generateInviteCode();
  }

  const { data: family, error: familyError } = await supabase
    .from("families")
    .insert({ name, invite_code: inviteCode, created_by: user.id })
    .select("id")
    .single();

  if (familyError || !family) {
    return { error: "No se pudo crear la familia. Intenta de nuevo." };
  }

  const { error: memberError } = await supabase
    .from("family_members")
    .insert({ family_id: family.id, user_id: user.id, role: "dueño" });

  if (memberError) {
    return { error: "La familia se creó pero no se pudo registrar tu membresía." };
  }

  revalidatePath("/panel");
  redirect("/panel");
}

/** Une al usuario a una familia existente usando el código de invitación. */
export async function joinFamily(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (code.length !== 6) {
    return { error: "El código tiene 6 caracteres. Revisa e intenta de nuevo." };
  }

  const { data: familyId, error: rpcError } = await supabase.rpc("join_family", {
    p_code: code,
  });

  if (rpcError || !familyId) {
    return { error: "Ese código no corresponde a ninguna familia." };
  }

  revalidatePath("/panel");
  redirect("/panel");
}

/** Cierra la sesión del usuario. */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/ingresar");
}
