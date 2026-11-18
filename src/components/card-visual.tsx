import type { CSSProperties } from "react";

export type Franchise = "visa" | "mastercard" | "amex" | "diners" | "codensa" | "otra";
export type CardType = "credito" | "debito";
export type Tier = "clasica" | "gold" | "platinum" | "black" | "infinite";

export const FRANCHISES: Array<{ value: Franchise; label: string }> = [
  { value: "visa", label: "Visa" },
  { value: "mastercard", label: "Mastercard" },
  { value: "amex", label: "American Express" },
  { value: "diners", label: "Diners Club" },
  { value: "codensa", label: "Códensa" },
  { value: "otra", label: "Otra" },
];

export const ISSUERS: Record<Franchise, string[]> = {
  visa: ["Bancolombia", "Davivienda", "BBVA", "Banco de Bogotá", "Scotiabank Colpatria", "Nu", "Otro"],
  mastercard: ["Bancolombia", "Davivienda", "BBVA", "Banco de Bogotá", "Scotiabank Colpatria", "Falabella", "Otro"],
  amex: ["Bancolombia", "Scotiabank Colpatria", "Otro"],
  diners: ["Bancolombia", "Davivienda", "Otro"],
  codensa: ["Credibanca", "Éxito", "Otro"],
  otra: ["Otro"],
};

export const TIER_LABELS: Record<Tier, string> = {
  clasica: "Clásica",
  gold: "Oro",
  platinum: "Platino",
  black: "Black",
  infinite: "Infinite",
};

const FRANCHISE_GRADIENTS: Record<Franchise, string> = {
  visa: "linear-gradient(135deg, #1a1f71 0%, #2743a6 55%, #3b5bd6 100%)",
  mastercard: "linear-gradient(135deg, #1f1f1f 0%, #3d2a14 60%, #a35a1b 130%)",
  amex: "linear-gradient(135deg, #016fd0 0%, #1f8ad9 100%)",
  diners: "linear-gradient(135deg, #46536b 0%, #7488a5 100%)",
  codensa: "linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)",
  otra: "linear-gradient(135deg, #1e293b 0%, #475569 100%)",
};

const TIER_OVERLAYS: Partial<Record<Tier, string>> = {
  gold: "linear-gradient(135deg, rgba(250,204,21,0.35) 0%, rgba(146,64,14,0.25) 100%)",
  platinum: "linear-gradient(135deg, rgba(203,213,225,0.28) 0%, rgba(71,85,105,0.18) 100%)",
  black: "linear-gradient(160deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.30) 100%)",
  infinite: "linear-gradient(160deg, rgba(0,0,0,0.72) 0%, rgba(30,0,0,0.40) 100%)",
};

export const FRANCHISE_ACCENT: Record<Franchise, string> = {
  visa: "#1a1f71",
  mastercard: "#eb001b",
  amex: "#016fd0",
  diners: "#46536b",
  codensa: "#b91c1c",
  otra: "#334155",
};

function Chip() {
  return (
    <div className="relative h-7 w-10 shrink-0 rounded-md border border-amber-200/60 bg-gradient-to-br from-amber-200 via-amber-300 to-amber-500 shadow-inner">
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-amber-600/40" />
      <div className="absolute left-0 top-1/3 h-px w-full bg-amber-600/40" />
      <div className="absolute left-0 top-2/3 h-px w-full bg-amber-600/40" />
    </div>
  );
}

function FranchiseLogo({ franchise }: { franchise: Franchise }) {
  switch (franchise) {
    case "visa":
      return (
        <span
          className="text-lg font-black italic tracking-[0.18em] text-white drop-shadow"
          style={{ fontFamily: "var(--font-geist-sans)" }}
        >
          VISA
        </span>
      );
    case "mastercard":
      return (
        <span className="flex items-center" aria-label="Mastercard">
          <span className="h-6 w-6 rounded-full bg-[#eb001b]" />
          <span className="-ml-2.5 h-6 w-6 rounded-full bg-[#f79e1b] opacity-90 mix-blend-screen" />
        </span>
      );
    case "amex":
      return (
        <span className="rounded-sm bg-white px-1.5 py-0.5 text-[10px] font-black leading-none tracking-tight text-[#016fd0]">
          AMERICAN
          <br />
          EXPRESS
        </span>
      );
    case "diners":
      return (
        <span className="flex items-center gap-1.5">
          <span className="h-5 w-5 rounded-full border-2 border-white/90 flex items-center justify-center">
            <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-white/90">
            Diners Club
          </span>
        </span>
      );
    case "codensa":
      return (
        <span className="text-xs font-black uppercase tracking-widest text-white">
          códensa
        </span>
      );
    default:
      return (
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
          Tarjeta
        </span>
      );
  }
}

export function CardVisual({
  franchise = "otra",
  issuer = "",
  tier = "clasica",
  last4 = "",
  cardType = "credito",
  className = "",
  small = false,
}: {
  franchise?: Franchise | string;
  issuer?: string;
  tier?: Tier | string;
  last4?: string;
  cardType?: CardType | string;
  className?: string;
  small?: boolean;
}) {
  const f = (FRANCHISES.some((x) => x.value === franchise) ? franchise : "otra") as Franchise;
  const t = (tier in TIER_LABELS ? tier : "clasica") as Tier;

  const style: CSSProperties = {
    backgroundImage: `${TIER_OVERLAYS[t] ?? ""}, ${FRANCHISE_GRADIENTS[f]}`,
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl text-white shadow-xl ${
        small ? "p-3.5" : "p-5"
      } aspect-[1.586/1] flex flex-col justify-between w-full ${className}`}
      style={style}
    >
      {/* Brillo diagonal tipo tarjeta plástica */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(115deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.05) 18%, rgba(255,255,255,0) 38%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.08) 100%)",
        }}
      />

      {/* Fila superior: banco y tipo */}
      <div className="relative flex items-start justify-between gap-2">
        <span className={`font-semibold tracking-wide ${small ? "text-xs" : "text-sm"} truncate max-w-[60%]`}>
          {issuer || "Tu banco"}
        </span>
        <span
          className={`rounded-full border border-white/30 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
            cardType === "debito" ? "bg-white/15" : "bg-white/10"
          }`}
        >
          {cardType === "debito" ? "Débito" : TIER_LABELS[t]}
        </span>
      </div>

      {/* Chip */}
      <div className="relative">
        <Chip />
      </div>

      {/* Fila inferior: número y franquicia */}
      <div className="relative flex items-end justify-between gap-2">
        <span
          className={`font-mono tracking-[0.25em] text-white/95 ${
            small ? "text-[11px]" : "text-sm"
          }`}
        >
          •••• {last4 || "••••"}
        </span>
        <FranchiseLogo franchise={f} />
      </div>
    </div>
  );
}
