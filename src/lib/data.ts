import { createClient } from "@/lib/supabase/server";
import type { Family, FamilyMember, Profile, Role } from "@/lib/types";

export interface UserContext {
  user: { id: string; email?: string };
  profile: Profile | null;
  family: Family | null;
  role: Role | null;
}

/**
 * Carga el contexto del usuario autenticado:
 * su perfil, su familia (si tiene) y su rol dentro de ella.
 * Retorna null si no hay sesión.
 */
export async function getUserContext(): Promise<UserContext | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Perfil
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("id", user.id)
    .single<Profile>();

  // Membresía y familia
  const { data: member } = await supabase
    .from("family_members")
    .select("family_id, role, families (id, name, invite_code, created_by)")
    .eq("user_id", user.id)
    .maybeSingle<{
      family_id: string;
      role: Role;
      families: Family | Family[] | null;
    }>();

  const familyData = member?.families;
  const family = Array.isArray(familyData) ? familyData[0] : (familyData ?? null);

  return {
    user: { id: user.id, email: user.email },
    profile: profile ?? null,
    family,
    role: member?.role ?? null,
  };
}

/** Lista los miembros de una familia (con su perfil). */
export async function getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("family_members")
    .select(
      "family_id, user_id, role, joined_at, profile:profiles!inner (id, display_name, avatar_url)"
    )
    .eq("family_id", familyId)
    .order("joined_at");

  if (error) return [];
  return (data ?? []) as unknown as FamilyMember[];
}
