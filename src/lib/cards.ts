import type { CardPurchase } from "@/lib/types";

/** YYYY-MM del mes actual */
export function currentMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Suma (o resta) n meses a una clave YYYY-MM */
export function shiftMonth(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Etiqueta del mes: "dic 2026" */
export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CO", { month: "short", year: "numeric" })
    .format(new Date(y, m - 1, 1))
    .replace(".", "");
}

/** Cuántos meses hay de un YYYY-MM a otro (positivo si b es posterior) */
function monthsBetween(a: string, b: string): number {
  const [ay, am] = a.split("-").map(Number);
  const [by, bm] = b.split("-").map(Number);
  return (by - ay) * 12 + (bm - am);
}

/** ¿La compra tiene cuota activa en ese mes? */
export function purchaseActiveIn(p: CardPurchase, month: string): boolean {
  const diff = monthsBetween(p.first_month.slice(0, 7), month);
  return diff >= 0 && diff < p.installments;
}

/** Valor de cada cuota de una compra */
export function installmentValue(p: CardPurchase): number {
  return Number(p.total_amount) / p.installments;
}

/**
 * Programa de extractos: para cada uno de los próximos `months` meses,
 * cuánto toca pagar en el corte de ese mes (suma de cuotas activas).
 */
export function buildSchedule(
  purchases: CardPurchase[],
  months = 6
): Array<{ month: string; due: number }> {
  const start = currentMonthKey();
  const schedule: Array<{ month: string; due: number }> = [];
  for (let i = 0; i < months; i++) {
    const month = shiftMonth(start, i);
    const due = purchases
      .filter((p) => purchaseActiveIn(p, month))
      .reduce((s, p) => s + installmentValue(p), 0);
    schedule.push({ month, due });
  }
  return schedule;
}

/**
 * Cuotas restantes de una compra contando desde el mes actual:
 * cuántas cuotas de esa compra aún no se han "vencido".
 */
export function remainingInstallments(p: CardPurchase, today = currentMonthKey()): number {
  const passed = monthsBetween(p.first_month.slice(0, 7), today);
  return Math.max(p.installments - Math.max(passed, 0), 0);
}
