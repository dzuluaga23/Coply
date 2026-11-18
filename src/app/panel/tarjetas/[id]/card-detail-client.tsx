"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatCOP, formatDateShort, todayISO } from "@/lib/format";
import { calcInstallment, currentMonthKey, installmentValue, monthLabel, purchaseInterest, remainingInstallments, shiftMonth } from "@/lib/cards";
import { CardVisual, TIER_LABELS, type Tier } from "@/components/card-visual";
import type { CardPayment, CardPurchase } from "@/lib/types";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  ArrowLeft,
  CalendarClock,
  CreditCard,
  HandCoins,
  MoreVertical,
  ShoppingCart,
  Trash2,
} from "lucide-react";

interface DetailProps {
  card: {
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
  };
  purchases: (CardPurchase & { profile?: { display_name: string } | null })[];
  payments: (CardPayment & { profile?: { display_name: string } | null })[];
  schedule: Array<{ month: string; due: number }>;
  totalDebt: number;
  paid: number;
}

export function CardDetailClient({ card, purchases, payments, schedule, totalDebt, paid }: DetailProps) {
  const router = useRouter();
  const remaining = Math.max(totalDebt - paid, 0);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link href="/panel/tarjetas">
            <ArrowLeft className="h-4 w-4" />
            Tarjetas
          </Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <CardVisual
              franchise={card.franchise}
              issuer={card.issuer}
              tier={card.tier}
              last4={card.last4}
              cardType={card.card_type}
              small
              className="w-44 shrink-0"
            />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{card.name}</h1>
              <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                <CalendarClock className="h-3.5 w-3.5" />
                Corte el día {card.cutoff_day} de cada mes
              </p>
              <p className="text-xs text-muted-foreground">
                {card.issuer || "Sin banco"} ·{" "}
                {card.card_type === "debito"
                  ? "Débito"
                  : TIER_LABELS[(card.tier as Tier) ?? "clasica"]}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <AddPurchaseDialog cardId={card.id} />
            <AddPaymentDialog cardId={card.id} />
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Por pagar</CardDescription>
            <CardTitle className="text-xl tabular-nums">{formatCOP(remaining)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Abonado</CardDescription>
            <CardTitle className="text-xl tabular-nums text-emerald-600">
              {formatCOP(paid)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total a pagar (con intereses)</CardDescription>
            <CardTitle className="text-xl tabular-nums text-muted-foreground">
              {formatCOP(totalDebt)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cupo disponible</CardDescription>
            <CardTitle className="text-xl tabular-nums">
              {formatCOP(Math.max(Number(card.credit_limit) - remaining, 0))}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Próximos extractos */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos extractos</CardTitle>
          <CardDescription>
            Cuánto toca pagar en el corte de cada mes (suma de cuotas activas)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {schedule.map((s) => (
              <li key={s.month} className="flex items-center justify-between py-2.5">
                <span className="text-sm capitalize">
                  {s.month === currentMonthKey() ? "Este mes" : monthLabel(s.month)}
                </span>
                <span
                  className={`text-sm font-medium tabular-nums ${
                    s.due === 0 ? "text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {s.due === 0 ? "Sin cuotas" : formatCOP(s.due)}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Compras a cuotas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Compras a cuotas ({purchases.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {purchases.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Sin compras registradas.
              </p>
            ) : (
              <ul className="divide-y">
                {purchases.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {p.description || "Compra"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.installments} cuota(s) de {formatCOP(installmentValue(p))} ·{" "}
                        primera en {monthLabel(p.first_month.slice(0, 7))} · quedan{" "}
                        {remainingInstallments(p)}
                        {Number(p.interest_rate ?? 0) > 0 &&
                          ` · intereses ${formatCOP(purchaseInterest(p))}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium tabular-nums">
                        {formatCOP(Number(p.total_amount))}
                      </span>
                      <DeleteButton
                        label="Borrar compra"
                        onDelete={async () => {
                          const supabase = createClient();
                          const { error } = await supabase
                            .from("card_purchases")
                            .delete()
                            .eq("id", p.id);
                          if (error) {
                            toast.error("No se pudo borrar la compra.");
                            return;
                          }
                          toast.success("Compra borrada.");
                          router.refresh();
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Abonos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HandCoins className="h-4 w-4" />
              Abonos ({payments.length})
            </CardTitle>
            <CardDescription>Cada abono baja lo que debes</CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Sin abonos todavía.
              </p>
            ) : (
              <ul className="divide-y">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {p.note || "Abono"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateShort(p.paid_at)} ·{" "}
                        {p.profile?.display_name ?? "Alguien"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium tabular-nums text-emerald-600">
                        {formatCOP(Number(p.amount))}
                      </span>
                      <DeleteButton
                        label="Borrar abono"
                        onDelete={async () => {
                          const supabase = createClient();
                          const { error } = await supabase
                            .from("card_payments")
                            .delete()
                            .eq("id", p.id);
                          if (error) {
                            toast.error("No se pudo borrar el abono.");
                            return;
                          }
                          toast.success("Abono borrado.");
                          router.refresh();
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DeleteButton({ label, onDelete }: { label: string; onDelete: () => Promise<void> }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem variant="destructive" onClick={() => onDelete()}>
          <Trash2 className="h-4 w-4" />
          {label}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AddPurchaseDialog({ cardId }: { cardId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [total, setTotal] = useState("");
  const [installments, setInstallments] = useState("1");
  const [interest, setInterest] = useState("0");
  const [firstMonth, setFirstMonth] = useState(shiftMonth(currentMonthKey(), 1));
  const [loading, setLoading] = useState(false);

  // Estimación de cuota en vivo (misma fórmula del banco)
  const estTotal = Number(total.replace(/[^\d.]/g, "")) || 0;
  const estN = Number(installments) || 1;
  const estRate = Number(interest) || 0;
  const estCuota = estTotal > 0 ? calcInstallment(estTotal, estN, estRate) : 0;

  const monthOptions = Array.from({ length: 8 }, (_, i) =>
    shiftMonth(currentMonthKey(), i)
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const totalValue = Number(total.replace(/[^\d.]/g, ""));
      const inst = Number(installments);
      if (!totalValue || totalValue <= 0) {
        toast.error("Escribe el valor de la compra.");
        return;
      }
      if (!inst || inst < 1 || inst > 60) {
        toast.error("Las cuotas van de 1 a 60.");
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

      const { error } = await supabase.from("card_purchases").insert({
        family_id: member.family_id,
        card_id: cardId,
        created_by: user.id,
        description: description.trim(),
        total_amount: totalValue,
        installments: inst,
        interest_rate: estRate,
        first_month: `${firstMonth}-01`,
      });

      if (error) {
        toast.error("No se pudo registrar la compra.");
        return;
      }

      toast.success("Compra registrada ✅");
      setOpen(false);
      setDescription("");
      setTotal("");
      setInstallments("1");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <ShoppingCart className="h-4 w-4" />
          Registrar compra
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Compra a cuotas</DialogTitle>
          <DialogDescription>
            Como la lleva tu banco: cuántas cuotas y en qué mes empiezan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="p-desc">¿Qué compraste?</Label>
            <Input
              id="p-desc"
              placeholder="Ej: Televisor"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={80}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-total">Valor total</Label>
            <Input
              id="p-total"
              inputMode="numeric"
              placeholder="Ej: 1200000"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              required
              className="text-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="p-inst">Cuotas</Label>
              <Input
                id="p-inst"
                type="number"
                min={1}
                max={60}
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-rate">Interés mensual (%)</Label>
              <Input
                id="p-rate"
                type="number"
                min={0}
                max={99}
                step="0.01"
                placeholder="Ej: 2.35"
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Primera cuota en</Label>
            <Select value={firstMonth} onValueChange={setFirstMonth}>
              <SelectTrigger className="w-full capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((m) => (
                  <SelectItem key={m} value={m} className="capitalize">
                    {monthLabel(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {estTotal > 0 && (
            <div className="rounded-lg bg-muted px-3 py-2.5 text-sm">
              <p>
                Cuota estimada:{" "}
                <span className="font-semibold">{formatCOP(estCuota)}</span> por{" "}
                {estN} mes(es)
              </p>
              <p className="text-xs text-muted-foreground">
                {estRate > 0
                  ? `Con interés del ${estRate}% mensual pagas ${formatCOP(estCuota * estN)} en total (${formatCOP(estCuota * estN - estTotal)} de intereses)`
                  : `Sin interés: pagas ${formatCOP(estTotal)} en total`}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Guardando..." : "Registrar compra"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddPaymentDialog({ cardId }: { cardId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const value = Number(amount.replace(/[^\d.]/g, ""));
      if (!value || value <= 0) {
        toast.error("Escribe un valor válido.");
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

      const { error } = await supabase.from("card_payments").insert({
        family_id: member.family_id,
        card_id: cardId,
        created_by: user.id,
        amount: value,
        note: note.trim(),
        paid_at: date,
      });

      if (error) {
        toast.error("No se pudo registrar el abono.");
        return;
      }

      toast.success("Abono registrado ✅");
      setOpen(false);
      setAmount("");
      setNote("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <HandCoins className="h-4 w-4" />
          Abonar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Abonar a la tarjeta</DialogTitle>
          <DialogDescription>
            Cada abono baja lo que debes. Regístralo tal como lo pagaste.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pay-amount">Valor del abono</Label>
            <Input
              id="pay-amount"
              inputMode="numeric"
              placeholder="Ej: 300000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="text-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pay-date">Fecha</Label>
            <Input
              id="pay-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={todayISO()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pay-note">Nota (opcional)</Label>
            <Input
              id="pay-note"
              placeholder="Ej: pago del extracto de noviembre"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={80}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Guardando..." : "Registrar abono"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
