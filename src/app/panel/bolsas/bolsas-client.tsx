"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatCOP } from "@/lib/format";
import type { Envelope } from "@/lib/types";
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
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  MoreVertical,
  PiggyBank,
  PlusCircle,
  Trash2,
} from "lucide-react";

export function EnvelopesClient({ initialEnvelopes }: { initialEnvelopes: Envelope[] }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);

  // Tiempo real: si alguien de la familia mueve plata de una bolsa, se refresca
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("envelopes-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "envelopes" },
        () => router.refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const totalSaved = initialEnvelopes.reduce((s, e) => s + Number(e.saved_amount), 0);
  const totalGoal = initialEnvelopes.reduce((s, e) => s + Number(e.goal_amount), 0);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bolsas</h1>
          <p className="text-muted-foreground text-sm">
            Aparta plata por metas: vacaciones, diciembre, imprevistos...
          </p>
        </div>
        <CreateEnvelopeDialog open={createOpen} setOpen={setCreateOpen} />
      </div>

      {initialEnvelopes.length > 0 && (
        <Card className="border-emerald-600/20 bg-emerald-500/5">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <PiggyBank className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">
                Total ahorrado: {formatCOP(totalSaved)}
                {totalGoal > 0 && (
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    de {formatCOP(totalGoal)}
                  </span>
                )}
              </p>
              <Progress
                value={totalGoal > 0 ? (totalSaved / totalGoal) * 100 : 0}
                className="mt-2 h-2"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {initialEnvelopes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center text-sm text-muted-foreground">
            <PiggyBank className="h-10 w-10 opacity-40" />
            <p>
              Aún no tienen bolsas creadas.
              <br />
              Crea la primera y empiecen a apartar juntos.
            </p>
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
              Crear la primera bolsa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {initialEnvelopes.map((env) => (
            <EnvelopeCard key={env.id} env={env} />
          ))}
        </div>
      )}
    </div>
  );
}

function EnvelopeCard({ env }: { env: Envelope }) {
  const router = useRouter();
  const saved = Number(env.saved_amount);
  const goal = Number(env.goal_amount);
  const pct = goal > 0 ? Math.min((saved / goal) * 100, 100) : 0;
  const done = saved >= goal;

  async function move(amount: number, direction: "add" | "withdraw") {
    if (!amount || amount <= 0) {
      toast.error("Escribe un valor válido.");
      return;
    }
    if (direction === "withdraw" && amount > saved) {
      toast.error("No hay suficiente plata en la bolsa.");
      return;
    }
    const supabase = createClient();
    const newValue =
      direction === "add" ? saved + amount : Math.max(saved - amount, 0);
    const { error } = await supabase
      .from("envelopes")
      .update({ saved_amount: newValue })
      .eq("id", env.id);
    if (error) {
      toast.error("No se pudo mover la plata.");
      return;
    }
    toast.success(
      direction === "add"
        ? `Abonaste ${formatCOP(amount)} a ${env.name} ✅`
        : `Retiraste ${formatCOP(amount)} de ${env.name}`
    );
    router.refresh();
  }

  async function remove() {
    const supabase = createClient();
    const { error } = await supabase.from("envelopes").delete().eq("id", env.id);
    if (error) {
      toast.error("No se pudo borrar la bolsa.");
      return;
    }
    toast.success("Bolsa borrada.");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: env.color }}
            />
            {env.name}
            {done && (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => remove()}
                >
                  <Trash2 className="h-4 w-4" />
                  Borrar bolsa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <CardDescription className="tabular-nums">
          {formatCOP(saved)} de {formatCOP(goal)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={pct} className="h-2.5" />
        <p className="text-xs text-muted-foreground">
          {done
            ? "¡Meta cumplida! 🎉"
            : `Falta ${formatCOP(Math.max(goal - saved, 0))}`}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <MoveMoneyDialog
            envId={env.id}
            envName={env.name}
            direction="add"
            onMove={move}
          />
          <MoveMoneyDialog
            envId={env.id}
            envName={env.name}
            direction="withdraw"
            onMove={move}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function MoveMoneyDialog({
  envName,
  direction,
  onMove,
}: {
  envId: string;
  envName: string;
  direction: "add" | "withdraw";
  onMove: (amount: number, direction: "add" | "withdraw") => void;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const isAdd = direction === "add";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onMove(Number(amount.replace(/[^\d.]/g, "")), direction);
      setOpen(false);
      setAmount("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={isAdd ? "default" : "outline"} size="sm" className="w-full">
          {isAdd ? (
            <>
              <ArrowDownToLine className="h-4 w-4" />
              Abonar
            </>
          ) : (
            <>
              <ArrowUpFromLine className="h-4 w-4" />
              Retirar
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>
            {isAdd ? "Abonar a" : "Retirar de"} «{envName}»
          </DialogTitle>
          <DialogDescription>
            {isAdd
              ? "Cuánta plata quieres apartar en esta bolsa."
              : "Cuánta plata quieres sacar de la bolsa."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`amount-${direction}-${envName}`}>Valor</Label>
            <Input
              id={`amount-${direction}-${envName}`}
              inputMode="numeric"
              placeholder="Ej: 50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="text-lg"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Moviendo..." : isAdd ? "Abonar" : "Retirar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateEnvelopeDialog({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [color, setColor] = useState("#16a34a");
  const [loading, setLoading] = useState(false);

  const colors = [
    { value: "#16a34a", label: "Verde" },
    { value: "#3b82f6", label: "Azul" },
    { value: "#f59e0b", label: "Ámbar" },
    { value: "#ec4899", label: "Rosa" },
    { value: "#8b5cf6", label: "Violeta" },
    { value: "#ef4444", label: "Rojo" },
  ];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const goalValue = Number(goal.replace(/[^\d.]/g, ""));
      if (!goalValue || goalValue <= 0) {
        toast.error("Escribe una meta válida.");
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

      const { error } = await supabase.from("envelopes").insert({
        family_id: member.family_id,
        name: name.trim(),
        goal_amount: goalValue,
        color,
      });

      if (error) {
        toast.error("No se pudo crear la bolsa.");
        return;
      }

      toast.success("Bolsa creada ✅");
      setOpen(false);
      setName("");
      setGoal("");
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
          Nueva bolsa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nueva bolsa</DialogTitle>
          <DialogDescription>
            Una meta con nombre: vacaciones, diciembre, un Televisor...
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="env-name">Nombre de la meta</Label>
            <Input
              id="env-name"
              placeholder="Ej: Vacaciones en San Andrés"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={40}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="env-goal">Meta (cuánto quieres juntar)</Label>
            <Input
              id="env-goal"
              inputMode="numeric"
              placeholder="Ej: 1500000"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              required
              className="text-lg"
            />
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
                    color === c.value
                      ? "scale-110 border-foreground"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: c.value }}
                  aria-label={c.label}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creando..." : "Crear bolsa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
