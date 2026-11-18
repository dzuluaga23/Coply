"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatCOP } from "@/lib/format";
import {
  LIGHT_STYLES,
  LIMIT_FLOW,
  LIMIT_FLOW_UVT,
  LIMIT_PATRIMONIO,
  LIMIT_PATRIMONIO_UVT,
  UVT_2026,
  lightOf,
  pctOf,
  type LightState,
} from "@/lib/dian";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Landmark, Pencil } from "lucide-react";

export interface MemberDian {
  profile_id: string;
  name: string;
  role: string;
  year: number;
  elapsedMonths: number;
  /** Valores totales (app + extras) por criterio */
  ingresos: number;
  tarjeta: number;
  compras: number;
  consignaciones: number;
  patrimonio: number;
  /** Lo que la familia registró a mano */
  extras: {
    patrimonio: number;
    ingresos: number;
    tarjeta: number;
    compras: number;
    consignaciones: number;
  };
  /** Lo que la app calculó solo */
  autos: {
    ingresos: number;
    tarjeta: number;
    compras: number;
    consignaciones: number;
  };
}

interface CriterionRow {
  key: string;
  label: string;
  hint: string;
  value: number;
  limit: number;
  projected: number | null;
}

/** Proyección de fin de año: valor actual anualizado */
function project(value: number, elapsedMonths: number): number | null {
  if (elapsedMonths >= 12) return null;
  return elapsedMonths > 0 ? (value / elapsedMonths) * 12 : 0;
}

function Verdict({ member }: { member: MemberDian }) {
  const mustNow =
    member.ingresos >= LIMIT_FLOW ||
    member.tarjeta >= LIMIT_FLOW ||
    member.compras >= LIMIT_FLOW ||
    member.consignaciones >= LIMIT_FLOW ||
    member.patrimonio >= LIMIT_PATRIMONIO;

  const willBe =
    (project(member.ingresos, member.elapsedMonths) ?? 0) >= LIMIT_FLOW ||
    (project(member.tarjeta, member.elapsedMonths) ?? 0) >= LIMIT_FLOW ||
    (project(member.compras, member.elapsedMonths) ?? 0) >= LIMIT_FLOW ||
    (project(member.consignaciones, member.elapsedMonths) ?? 0) >= LIMIT_FLOW ||
    member.patrimonio >= LIMIT_PATRIMONIO;

  if (mustNow) {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-600 dark:text-red-400">
        <AlertTriangle className="h-3.5 w-3.5" />
        Debe declarar renta
      </span>
    );
  }
  if (willBe) {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
        <AlertTriangle className="h-3.5 w-3.5" />
        Al ritmo actual, declararía
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
      <CheckCircle2 className="h-3.5 w-3.5" />
      Bajo los topes
    </span>
  );
}

function LightRow({ row }: { row: CriterionRow }) {
  const state: LightState = lightOf(row.value, row.limit);
  const s = LIGHT_STYLES[state];
  const projState = row.projected !== null ? lightOf(row.projected, row.limit) : null;
  const pct = pctOf(row.value, row.limit).toFixed(0);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${s.dot}`} />
          <span className="truncate font-medium">{row.label}</span>
        </div>
        <span className="shrink-0 tabular-nums text-muted-foreground">
          {formatCOP(row.value)}{" "}
          <span className="text-xs">
            ({pct}% de {formatCOP(row.limit)})
          </span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${s.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {row.projected !== null && projState && (
        <p className={`text-xs ${LIGHT_STYLES[projState].text}`}>
          Proyección dic: {formatCOP(row.projected)}
        </p>
      )}
    </div>
  );
}

export function DianClient({
  year,
  elapsedMonths,
  members,
  familyId,
}: {
  year: number;
  elapsedMonths: number;
  members: MemberDian[];
  familyId: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<MemberDian | null>(null);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Semáforo DIAN</h1>
          <p className="text-muted-foreground text-sm">
            ¿Quién de la casa tendría que declarar renta por el {year}?
          </p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium">
          <Landmark className="h-3.5 w-3.5" />
          UVT {year}: {formatCOP(UVT_2026)}
        </span>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Los 5 topes de la DIAN para {year}
          </CardTitle>
          <CardDescription>
            Basta superar <strong>uno solo</strong> para quedar obligado a
            declarar. Los de movimientos valen {LIMIT_FLOW_UVT} UVT (
            {formatCOP(LIMIT_FLOW)}) y el patrimonio {LIMIT_PATRIMONIO_UVT} UVT (
            {formatCOP(LIMIT_PATRIMONIO)}).
          </CardDescription>
        </CardHeader>
      </Card>

      {members.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No hay miembros en el grupo todavía.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {members.map((m) => {
            const rows: CriterionRow[] = [
              {
                key: "ingresos",
                label: "Ingresos brutos",
                hint: "Todo lo que entró en el año",
                value: m.ingresos,
                limit: LIMIT_FLOW,
                projected: project(m.ingresos, elapsedMonths),
              },
              {
                key: "tarjeta",
                label: "Consumos con tarjeta",
                hint: "Compras diferidas con tarjeta",
                value: m.tarjeta,
                limit: LIMIT_FLOW,
                projected: project(m.tarjeta, elapsedMonths),
              },
              {
                key: "compras",
                label: "Compras y consumos",
                hint: "Gastos de movimientos + tarjetas",
                value: m.compras,
                limit: LIMIT_FLOW,
                projected: project(m.compras, elapsedMonths),
              },
              {
                key: "consignaciones",
                label: "Consignaciones bancarias",
                hint: "Aproximado con los ingresos registrados",
                value: m.consignaciones,
                limit: LIMIT_FLOW,
                projected: project(m.consignaciones, elapsedMonths),
              },
              {
                key: "patrimonio",
                label: "Patrimonio bruto",
                hint: "Casas, carros, ahorros... a mano",
                value: m.patrimonio,
                limit: LIMIT_PATRIMONIO,
                projected: null,
              },
            ];

            return (
              <Card key={m.profile_id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{m.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Verdict member={m} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground"
                        onClick={() => setEditing(m)}
                        aria-label={`Editar datos DIAN de ${m.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {rows.map((row) => (
                    <LightRow key={row.key} row={row} />
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Los ingresos, consumos y consignaciones se calculan con los movimientos y
        tarjetas que registra la familia. Con el lápiz ✏️ puedes sumar lo que
        quedó por fuera de la app (y el patrimonio bruto, que va a mano).
      </p>

      {editing && (
        <DianEditDialog
          familyId={familyId}
          member={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function DianEditDialog({
  familyId,
  member,
  onClose,
}: {
  familyId: string;
  member: MemberDian;
  onClose: () => void;
}) {
  const router = useRouter();
  const [patrimonio, setPatrimonio] = useState(String(Math.round(member.extras.patrimonio)));
  const [extraIngresos, setExtraIngresos] = useState(String(Math.round(member.extras.ingresos)));
  const [extraTarjeta, setExtraTarjeta] = useState(String(Math.round(member.extras.tarjeta)));
  const [extraCompras, setExtraCompras] = useState(String(Math.round(member.extras.compras)));
  const [extraConsignaciones, setExtraConsignaciones] = useState(
    String(Math.round(member.extras.consignaciones))
  );
  const [loading, setLoading] = useState(false);

  const fields = [
    {
      id: "d-pat",
      label: "Patrimonio bruto (a 31 de dic)",
      hint: "Casas, carros, ahorros, inversiones... sin restar deudas",
      value: patrimonio,
      set: setPatrimonio,
    },
    {
      id: "d-ing",
      label: "Otros ingresos (fuera de la app)",
      hint: `Lo registrado en movimientos: ${formatCOP(member.autos.ingresos)}`,
      value: extraIngresos,
      set: setExtraIngresos,
    },
    {
      id: "d-tar",
      label: "Otros consumos con tarjeta",
      hint: `Lo registrado en tarjetas: ${formatCOP(member.autos.tarjeta)}`,
      value: extraTarjeta,
      set: setExtraTarjeta,
    },
    {
      id: "d-com",
      label: "Otras compras y consumos",
      hint: `Lo registrado en movimientos y tarjetas: ${formatCOP(member.autos.compras)}`,
      value: extraCompras,
      set: setExtraCompras,
    },
    {
      id: "d-con",
      label: "Otras consignaciones",
      hint: `Aproximación con ingresos registrados: ${formatCOP(member.autos.consignaciones)}`,
      value: extraConsignaciones,
      set: setExtraConsignaciones,
    },
  ];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const num = (v: string) => Number(v.replace(/[^\d.]/g, "")) || 0;

      const { error } = await supabase.from("dian_data").upsert(
        {
          family_id: familyId,
          profile_id: member.profile_id,
          year: member.year,
          patrimonio_bruto: num(patrimonio),
          extra_ingresos: num(extraIngresos),
          extra_tarjeta: num(extraTarjeta),
          extra_compras: num(extraCompras),
          extra_consignaciones: num(extraConsignaciones),
          updated_by: user.id,
        },
        { onConflict: "family_id,profile_id,year" }
      );

      if (error) {
        toast.error("No se pudieron guardar los datos.");
        return;
      }

      toast.success("Datos DIAN actualizados ✅");
      onClose();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Datos DIAN de {member.name}</DialogTitle>
          <DialogDescription>
            Lo que la app calcula solo va sumado. Aquí agregas lo que quedó por
            fuera y el patrimonio (que va a mano).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {fields.map((f) => (
            <div key={f.id} className="space-y-1.5">
              <Label htmlFor={f.id}>{f.label}</Label>
              <Input
                id={f.id}
                inputMode="numeric"
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                placeholder="0"
              />
              <p className="text-[11px] text-muted-foreground">{f.hint}</p>
            </div>
          ))}
          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
