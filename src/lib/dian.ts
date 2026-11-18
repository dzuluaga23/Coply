import { formatCOP } from "@/lib/format";

/**
 * Semáforo Tributario DIAN — Colombia.
 *
 * Para saber si una persona natural debe declarar renta, la DIAN revisa si en
 * el año superó alguno de estos topes (Estatuto Tributario, art. 592-1):
 *
 * 1. Ingresos brutos ≥ 1.400 UVT
 * 2. Consumos con tarjeta de crédito ≥ 1.400 UVT
 * 3. Compras y consumos totales ≥ 1.400 UVT
 * 4. Consignaciones bancarias, depósitos o inversiones ≥ 1.400 UVT
 * 5. Patrimonio bruto a 31 de diciembre ≥ 4.500 UVT
 *
 * Basta superar UNO solo para quedar obligado a declarar.
 *
 * UVT 2026: $52.374 (Resolución DIAN 000238 del 15-dic-2025).
 * Actualizar aquí cada diciembre cuando la DIAN fije la UVT del año siguiente.
 */
export const UVT_2026 = 52374;

export const LIMIT_FLOW_UVT = 1400;
export const LIMIT_PATRIMONIO_UVT = 4500;

/** Tope en pesos de los criterios de movimientos (1.400 UVT) */
export const LIMIT_FLOW = LIMIT_FLOW_UVT * UVT_2026;
/** Tope de patrimonio bruto en pesos (4.500 UVT) */
export const LIMIT_PATRIMONIO = LIMIT_PATRIMONIO_UVT * UVT_2026;

/** Estado del semáforo para un valor frente a su tope */
export type LightState = "verde" | "amarillo" | "rojo";

export function lightOf(value: number, limit: number): LightState {
  const pct = value / limit;
  if (pct >= 1) return "rojo";
  if (pct >= 0.7) return "amarillo";
  return "verde";
}

/** Colores del semáforo (fondo, texto y punto) */
export const LIGHT_STYLES: Record<
  LightState,
  { bg: string; text: string; dot: string; bar: string }
> = {
  verde: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
  },
  amarillo: {
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
    bar: "bg-amber-500",
  },
  rojo: {
    bg: "bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
    dot: "bg-red-500",
    bar: "bg-red-500",
  },
};

/** Porcentaje del tope ya usado, con tope visual al 100% */
export function pctOf(value: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min((value / limit) * 100, 100);
}

export function fmtLimit(limit: number): string {
  return formatCOP(limit);
}
