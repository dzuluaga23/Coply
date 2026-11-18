import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { formatCOP, formatDateShort, formatMonth, startOfMonthISO } from "@/lib/format";
import type { TransactionWithMeta } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  PlusCircle,
  Wallet,
} from "lucide-react";

export const instant = false;

export default function PanelPage() {
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <PanelContent />
    </Suspense>
  );
}

function PanelSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}

async function PanelContent() {
  const ctx = await getUserContext();
  if (!ctx?.family) redirect("/bienvenida");

  const supabase = await createClient();
  const monthStart = startOfMonthISO();

  const { data: raw } = await supabase
    .from("transactions")
    .select(
      `*, category:categories (name, color), profile:profiles (display_name)`
    )
    .eq("family_id", ctx.family.id)
    .gte("occurred_at", monthStart)
    .order("occurred_at", { ascending: false })
    .limit(300);

  const transactions = (raw ?? []) as unknown as TransactionWithMeta[];

  const income = transactions
    .filter((t) => t.kind === "ingreso")
    .reduce((s, t) => s + Number(t.amount), 0);
  const expense = transactions
    .filter((t) => t.kind === "gasto")
    .reduce((s, t) => s + Number(t.amount), 0);
  const balance = income - expense;

  // ¿En qué se fue la plata? (top categorías de gasto)
  const byCategory = new Map<string, { name: string; color: string; total: number }>();
  for (const t of transactions) {
    if (t.kind !== "gasto") continue;
    const key = t.category?.name ?? "Sin categoría";
    const entry = byCategory.get(key) ?? {
      name: key,
      color: t.category?.color ?? "#64748b",
      total: 0,
    };
    entry.total += Number(t.amount);
    byCategory.set(key, entry);
  }
  const topCategories = [...byCategory.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight capitalize">
            {formatMonth(new Date())}
          </h1>
          <p className="text-muted-foreground text-sm">
            Así van las cuentas de {ctx.family.name}
          </p>
        </div>
        <Button asChild>
          <Link href="/panel/movimientos">
            <PlusCircle />
            Registrar movimiento
          </Link>
        </Button>
      </div>

      {/* Resumen del mes */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <ArrowDownCircle className="h-4 w-4 text-emerald-600" />
              Entró
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums text-emerald-600">
              {formatCOP(income)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <ArrowUpCircle className="h-4 w-4 text-red-500" />
              Salió
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums text-red-500">
              {formatCOP(expense)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              Queda en la billetera
            </CardDescription>
            <CardTitle
              className={`text-2xl tabular-nums ${balance < 0 ? "text-red-500" : "text-foreground"
                }`}
            >
              {formatCOP(balance)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ¿En qué se fue la plata? */}
        <Card>
          <CardHeader>
            <CardTitle>¿En qué se fue la plata?</CardTitle>
            <CardDescription>
              Lo más pesado de tus gastos este mes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topCategories.length === 0 ? (
              <EmptyHint />
            ) : (
              <div className="space-y-4">
                {topCategories.map((c) => (
                  <div key={c.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: c.color }}
                        />
                        {c.name}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {formatCOP(c.total)}
                      </span>
                    </div>
                    <Progress
                      value={expense > 0 ? (c.total / expense) * 100 : 0}
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Últimos movimientos */}
        <Card>
          <CardHeader>
            <CardTitle>Últimos movimientos</CardTitle>
            <CardDescription>Lo que cada uno ha registrado</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <EmptyHint />
            ) : (
              <ul className="divide-y">
                {transactions.slice(0, 6).map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {t.description || t.category?.name || "Movimiento"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateShort(t.occurred_at)} ·{" "}
                        {t.profile?.display_name ?? "Alguien"}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-medium tabular-nums ${t.kind === "ingreso" ? "text-emerald-600" : "text-foreground"
                        }`}
                    >
                      {t.kind === "ingreso" ? "+" : "−"}
                      {formatCOP(Number(t.amount))}
                    </span>
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

function EmptyHint() {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
      <Wallet className="h-8 w-8 opacity-40" />
      <p>
        Aún no hay nada registrado este mes.
        <br />
        ¡Registra tu primer movimiento!
      </p>
    </div>
  );
}
