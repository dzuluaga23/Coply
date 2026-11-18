/** Formatea un número como pesos colombianos: $ 12.500 */
export function formatCOP(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Formatea el nombre de un mes en español: "noviembre de 2026" */
export function formatMonth(date: Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    month: "long",
    year: "numeric",
  }).format(date);
}

/** Fecha corta: "17 nov" */
export function formatDateShort(iso: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${iso}T00:00:00`));
}

/** Primer día del mes actual (YYYY-MM-DD) */
export function startOfMonthISO(date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  return d.toISOString().slice(0, 10);
}

/** Hoy (YYYY-MM-DD) */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
