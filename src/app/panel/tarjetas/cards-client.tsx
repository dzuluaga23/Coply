"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatCOP } from "@/lib/format";
import type { CardSummary } from "@/lib/types";
import {
  CardVisual,
  FRANCHISES,
  FRANCHISE_ACCENT,
  ISSUERS,
  TIER_LABELS,
  type Franchise,
  type Tier,
} from "@/components/card-visual";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CreditCard, PlusCircle, CalendarClock } from "lucide-react";

export function CardsClient({ cards }: { cards: CardSummary[] }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);

  const totalDebt = cards.reduce((s, c) => s + c.remaining, 0);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tarjetas</h1>
          <p className="text-muted-foreground text-sm">
            Como las lleva tu banco: corte, cuotas y abonos
          </p>
        </div>
        <CreateCardDialog open={createOpen} setOpen={setCreateOpen} />
      </div>

      {cards.length > 0 && (
        <Card className="border-violet-600/20 bg-violet-500/5">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/10 text-violet-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Deuda total en tarjetas: {formatCOP(totalDebt)}
              </p>
              <p className="text-xs text-muted-foreground">
                Entre las {cards.length} tarjeta(s) de la familia
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {cards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center text-sm text-muted-foreground">
            <CreditCard className="h-10 w-10 opacity-40" />
            <p>
              Aún no tienen tarjetas registradas.
              <br />
              Agrega la primera y deja de llevarte sorpresas con el extracto.
            </p>
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
              Registrar la primera tarjeta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <Link key={c.id} href={`/panel/tarjetas/${c.id}`} className="group">
              <div className="h-full rounded-2xl border bg-card transition-shadow group-hover:shadow-md">
                <div className="p-4 pb-0">
                  <CardVisual
                    franchise={c.franchise}
                    issuer={c.issuer}
                    tier={c.tier}
                    last4={c.last4}
                    cardType={c.card_type}
                    className="transition-transform group-hover:-translate-y-1"
                  />
                </div>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{c.name}</CardTitle>
                    <CardDescription className="flex shrink-0 items-center gap-1.5">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {c.cutoff_day}
                    </CardDescription>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-muted-foreground">Por pagar hoy</span>
                    <span className="font-semibold tabular-nums">
                      {formatCOP(c.remaining)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-muted-foreground">
                      Próximo corte ({c.nextMonthLabel})
                    </span>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {formatCOP(c.nextMonthDue)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cupo disponible: {formatCOP(Math.max(c.credit_limit - c.remaining, 0))} de{" "}
                    {formatCOP(c.credit_limit)}
                  </p>
                </CardContent>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateCardDialog({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const router = useRouter();
  const [franchise, setFranchise] = useState<Franchise>("visa");
  const [issuer, setIssuer] = useState("Bancolombia");
  const [customIssuer, setCustomIssuer] = useState("");
  const [cardType, setCardType] = useState("credito");
  const [tier, setTier] = useState<Tier>("clasica");
  const [name, setName] = useState("");
  const [cutoffDay, setCutoffDay] = useState("15");
  const [limit, setLimit] = useState("");
  const [last4, setLast4] = useState("");
  const [loading, setLoading] = useState(false);

  const issuerList = ISSUERS[franchise];
  const isCustomIssuer = !issuerList.includes(issuer);

  function changeFranchise(v: string) {
    setFranchise(v as Franchise);
    setIssuer(ISSUERS[v as Franchise][0]);
  }

  const finalIssuer =
    issuer === "Otro" ? customIssuer.trim() || "Banco" : issuer;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const day = Number(cutoffDay);
      if (!day || day < 1 || day > 28) {
        toast.error("El día de corte va del 1 al 28.");
        return;
      }
      if (last4 && !/^\d{4}$/.test(last4)) {
        toast.error("Los 4 últimos dígitos deben ser 4 números.");
        return;
      }
      const limitValue = Number(limit.replace(/[^\d.]/g, "")) || 0;
      if (limitValue < 0) {
        toast.error("Escribe un cupo válido.");
        return;
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: member } = await supabase
        .from("family_members")
        .select("family_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!member) {
        toast.error("No se encontró tu grupo familiar.");
        return;
      }

      const displayName =
        name.trim() ||
        `${finalIssuer} · ${cardType === "debito" ? "Débito" : TIER_LABELS[tier]}`;

      const { error } = await supabase.from("cards").insert({
        family_id: member.family_id,
        name: displayName,
        cutoff_day: day,
        credit_limit: limitValue,
        color: FRANCHISE_ACCENT[franchise],
        franchise,
        issuer: finalIssuer,
        card_type: cardType,
        tier: cardType === "debito" ? "clasica" : tier,
        last4,
      });

      if (error) {
        toast.error("No se pudo registrar la tarjeta.");
        return;
      }

      toast.success("Tarjeta registrada ✅");
      setOpen(false);
      setName("");
      setLimit("");
      setLast4("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle />
          Nueva tarjeta
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva tarjeta</DialogTitle>
          <DialogDescription>
            Elige la franquicia y el banco; mira cómo queda tu tarjeta en vivo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {/* Vista previa estilo wallet */}
          <CardVisual
            franchise={franchise}
            issuer={finalIssuer}
            tier={cardType === "debito" ? "clasica" : tier}
            last4={last4}
            cardType={cardType}
            small
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Franquicia</Label>
              <Select value={franchise} onValueChange={changeFranchise}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FRANCHISES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Banco / emisor</Label>
              <Select value={issuer} onValueChange={setIssuer}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {issuerList.map((i) => (
                    <SelectItem key={i} value={i}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isCustomIssuer && (
            <div className="space-y-2">
              <Label htmlFor="custom-issuer">¿Cuál banco?</Label>
              <Input
                id="custom-issuer"
                placeholder="Escribe el nombre del banco"
                value={customIssuer}
                onChange={(e) => setCustomIssuer(e.target.value)}
                maxLength={30}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={cardType} onValueChange={setCardType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credito">Crédito</SelectItem>
                  <SelectItem value="debito">Débito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {cardType === "credito" ? (
              <div className="space-y-2">
                <Label>Nivel</Label>
                <Select value={tier} onValueChange={(v) => setTier(v as Tier)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TIER_LABELS) as Tier[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {TIER_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="c-cutoff">Día de corte (opcional)</Label>
                <Input
                  id="c-cutoff"
                  type="number"
                  min={1}
                  max={28}
                  value={cutoffDay}
                  onChange={(e) => setCutoffDay(e.target.value)}
                />
              </div>
            )}
          </div>

          {cardType === "credito" && (
            <div className="space-y-2">
              <Label htmlFor="c-cutoff2">Día de corte</Label>
              <Input
                id="c-cutoff2"
                type="number"
                min={1}
                max={28}
                value={cutoffDay}
                onChange={(e) => setCutoffDay(e.target.value)}
                required
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="c-limit">Cupo</Label>
              <Input
                id="c-limit"
                inputMode="numeric"
                placeholder="Ej: 2000000"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-last4">4 últimos dígitos</Label>
              <Input
                id="c-last4"
                inputMode="numeric"
                placeholder="Ej: 4567"
                value={last4}
                onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
                maxLength={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Guardando..." : "Registrar tarjeta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
