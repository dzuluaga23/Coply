export type Role = "dueño" | "miembro";

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

export interface Family {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
}

export interface FamilyMember {
  family_id: string;
  user_id: string;
  role: Role;
  joined_at: string;
  profile: Profile;
}

export interface Category {
  id: string;
  family_id: string;
  name: string;
  kind: "gasto" | "ingreso";
  color: string;
}

export interface Envelope {
  id: string;
  family_id: string;
  name: string;
  goal_amount: number;
  saved_amount: number;
  color: string;
  created_at: string;
}

export interface Card {
  id: string;
  family_id: string;
  name: string;
  cutoff_day: number;
  credit_limit: number;
  color: string;
  franchise: string;
  issuer: string;
  card_type: string;
  tier: string;
  last4: string;
  created_at: string;
}

export interface CardPurchase {
  id: string;
  family_id: string;
  card_id: string;
  created_by: string;
  description: string;
  total_amount: number;
  installments: number;
  interest_rate: number;
  first_month: string;
  created_at: string;
}

export interface CardPayment {
  id: string;
  family_id: string;
  card_id: string;
  created_by: string;
  amount: number;
  note: string;
  paid_at: string;
  created_at: string;
}

export interface CardSummary {
  id: string;
  name: string;
  cutoff_day: number;
  credit_limit: number;
  color: string;
  franchise: string;
  issuer: string;
  card_type: string;
  tier: string;
  last4: string;
  totalDebt: number;
  paid: number;
  remaining: number;
  nextMonthDue: number;
  nextMonthLabel: string;
  purchasesCount: number;
}

export interface Transaction {
  id: string;
  family_id: string;
  created_by: string;
  category_id: string | null;
  kind: "gasto" | "ingreso";
  amount: number;
  description: string;
  occurred_at: string;
  created_at: string;
}

export interface TransactionWithMeta extends Transaction {
  category: Pick<Category, "name" | "color"> | null;
  profile: Pick<Profile, "display_name"> | null;
}
