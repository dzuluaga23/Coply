"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatCOP, formatDateShort, todayISO } from "@/lib/format";
import type { Category, TransactionWithMeta } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  MoreVertical,
  PlusCircle,
  Trash2,
} from "lucide-react";

export function MovementsClient({
  initialTransactions,
  categories,
}: {
  initialTransactions: TransactionWithMeta[];
  categories: Category[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Tiempo real: si alguien de la familia registra algo, la lista se refresca
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("transactions-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) {
      toast.error("No se pudo borrar el movimiento.");
      return;
    }
    toast.success("Movimiento borrado.");
    router.refresh();
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Movimientos</h1>
          <p className="text-muted-foreground text-sm">
            Todo lo que entra y sale, en tiempo real
          </p>
        </div>
        <AddTransactionDialog
          open={open}
          setOpen={setOpen}
          categories={categories}
        />
      </div>

      <Card>
        <CardContent>
          {initialTransactions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
              <PlusCircle className="h-8 w-8 opacity-40" />
              <p>Nada registrado todavía.</p>
              <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
                Registrar el primero
              </Button>
            </div>
          ) : (
            <ul className="divide-y">
              {initialTransactions.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        t.kind === "ingreso"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {t.kind === "ingreso" ? (
                        <ArrowDownCircle className="h-4 w-4" />
                      ) : (
                        <ArrowUpCircle className="h-4 w-4" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {t.description || t.category?.name || "Movimiento"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateShort(t.occurred_at)} ·{" "}
                        {t.category?.name ?? "Sin categoría"} ·{" "}
                        {t.profile?.display_name ?? "Alguien"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-sm font-medium tabular-nums ${
                        t.kind === "ingreso"
                          ? "text-emerald-600"
                          : "text-foreground"
                      }`}
                    >
                      {t.kind === "ingreso" ? "+" : "−"}
                      {formatCOP(Number(t.amount))}
                    </span>
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
                          onClick={() => handleDelete(t.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Borrar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AddTransactionDialog({
  open,
  setOpen,
  categories,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  categories: Category[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [kind, setKind] = useState<"gasto" | "ingreso">("gasto");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState("");

  const kindCategories = categories.filter((c) => c.kind === kind);

  async function handleSubmit(e: React.FormEvent) {
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

      // El family_id lo inferimos de la primera categoría del grupo
      const familyId = categories[0]?.family_id;
      if (!familyId) {
        toast.error("No se encontró tu grupo familiar.");
        return;
      }

      const { error } = await supabase.from("transactions").insert({
        family_id: familyId,
        created_by: user.id,
        category_id: categoryId || null,
        kind,
        amount: value,
        description: description.trim(),
        occurred_at: date,
      });

      if (error) {
        toast.error("No se pudo registrar el movimiento.");
        return;
      }

      toast.success(
        kind === "gasto" ? "Gasto registrado ✅" : "Ingreso registrado ✅"
      );
      setOpen(false);
      setAmount("");
      setDescription("");
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
          Registrar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo movimiento</DialogTitle>
          <DialogDescription>
            Toma segundos. Todos en tu familia lo verán al instante.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs
            value={kind}
            onValueChange={(v) => {
              setKind(v as "gasto" | "ingreso");
              setCategoryId("");
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="gasto">Es un gasto</TabsTrigger>
              <TabsTrigger value="ingreso">Es un ingreso</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-2">
            <Label htmlFor="amount">¿Cuánto?</Label>
            <Input
              id="amount"
              inputMode="numeric"
              placeholder="Ej: 45000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="text-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Elige una" />
                </SelectTrigger>
                <SelectContent>
                  {kindCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={todayISO()}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Nota (opcional)</Label>
            <Input
              id="description"
              placeholder="Ej: mercado del mes en D1"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={120}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Guardando..." : "Guardar movimiento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
