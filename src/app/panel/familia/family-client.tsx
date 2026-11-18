"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ShieldCheck,
  Check,
  Copy,
  UsersRound,
  Crown,
} from "lucide-react";
import type { FamilyMember } from "@/lib/types";

export function FamilyClient({
  familyName,
  inviteCode,
  members,
}: {
  familyName: string;
  inviteCode: string;
  members: FamilyMember[];
}) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mi familia</h1>
        <p className="text-muted-foreground text-sm">
          Los que ven las cuentas de {familyName}
        </p>
      </div>

      {/* Código de invitación */}
      <Card>
        <CardHeader>
          <CardTitle>Código de invitación</CardTitle>
          <CardDescription>
            Compártelo con tu pareja o tu familia: entran con su cuenta, sin pagar
            nada aparte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <code className="rounded-lg bg-muted px-4 py-2 font-mono text-2xl font-bold tracking-[0.3em]">
              {inviteCode}
            </code>
            <Button variant="outline" size="sm" onClick={copyCode}>
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  ¡Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copiar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Miembros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersRound className="h-5 w-5" />
            Miembros ({members.length})
          </CardTitle>
          <CardDescription>
            Cada quien registra desde su celular; todos ven lo mismo al instante.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {members.map((m) => (
              <li key={m.user_id} className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {(m.profile?.display_name || "?")
                      .split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {m.profile?.display_name || "Miembro"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Entró el{" "}
                    {new Date(m.joined_at).toLocaleDateString("es-CO", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <Badge variant={m.role === "dueño" ? "default" : "secondary"}>
                  {m.role === "dueño" ? (
                    <span className="flex items-center gap-1">
                      <Crown className="h-3 w-3" />
                      Dueño
                    </span>
                  ) : (
                    "Miembro"
                  )}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Privacidad */}
      <Card className="border-emerald-600/20 bg-emerald-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
            Tus datos, solo de tu familia
          </CardTitle>
          <CardDescription>
            Esta familia es una "isla" independiente: ninguna otra familia del
            sistema puede ver ni un solo dato de ustedes, ni siquiera su nombre.
            La base de datos lo garantiza con reglas de seguridad (RLS) en el
            servidor.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
