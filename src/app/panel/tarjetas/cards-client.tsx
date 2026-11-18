"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatCOP } from "@/lib/format";
import type { CardSummary } from "@/lib/types";
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
              <Card className="h-full transition-shadow group-hover:shadow-md">
                <div className="h-2 w-full rounded-t-lg" style={{ backgroundColor: c.color }} />
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    {c.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Corte el día {c.cutoff_day}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
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
              </Card>
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
  const [name, setName] = useState("");
  const [cutoffDay, setCutoffDay] = useState("15");
  const [limit, setLimit] = useState("");
  const [color, setColor] = useState("#8b5cf6");
  const [loading, setLoading] = useState(false);

  const colors = [
    { value: "#8b5cf6", label: "Violeta" },
    { value: "#0ea5e9", label: "Celeste" },
    { value: "#f59e0b", label: "Ámbar" },
    { value: "#ef4444", label: "Rojo" },
    { value: "#10b981", label: "Esmeralda" },
    { value: "#334155", label: "Grafito" },
  ];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const day = Number(cutoffDay);
      if (!day || day < 1 || day > 28) {
        toast.error("El día de corte va del 1 al 28.");
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

      const { error } = await supabase.from("cards").insert({
        family_id: member.family_id,
        name: name.trim(),
        cutoff_day: day,
        credit_limit: limitValue,
        color,
      });

      if (error) {
        toast.error("No se pudo registrar la tarjeta.");
        return;
      }

      toast.success("Tarjeta registrada ✅");
      setOpen(false);
      setName("");
      setLimit("");
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
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nueva tarjeta</DialogTitle>
          <DialogDescription>
            Registra cómo la lleva tu banco: nombre, corte y cupo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="card-name">Nombre</Label>
            <Input
              id="card-name"
              placeholder="Ej: Visa Bancolombia"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={40}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="card-cutoff">Día de corte</Label>
              <Input
                id="card-cutoff"
                type="number"
                min={1}
                max={28}
                value={cutoffDay}
                onChange={(e) => setCutoffDay(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-limit">Cupo</Label>
              <Input
                id="card-limit"
                inputMode="numeric"
                placeholder="Ej: 2000000"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`h-8 w-8 rounded-full border-2 transition-transform ${
                    color === c.value ? "scale-110 border-foreground" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c.value }}
                  aria-label={c.label}
                />
              ))}
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
