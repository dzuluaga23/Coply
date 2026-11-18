"use client";

import { useActionState } from "react";
import { createFamily, joinFamily, type ActionResult } from "@/lib/actions/family";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useEffect } from "react";
import { Home, UsersRound } from "lucide-react";

export function WelcomeForms() {
  const [createState, createAction, createPending] = useActionState<
    ActionResult | null,
    FormData
  >(createFamily, null);

  const [joinState, joinAction, joinPending] = useActionState<
    ActionResult | null,
    FormData
  >(joinFamily, null);

  useEffect(() => {
    if (createState?.error) toast.error(createState.error);
  }, [createState]);

  useEffect(() => {
    if (joinState?.error) toast.error(joinState.error);
  }, [joinState]);

  return (
    <div className="w-full max-w-md space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            Crear mi grupo familiar
          </CardTitle>
          <CardDescription>
            Tú serás el dueño y podrás invitar a tu familia con un código.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la familia o grupo</Label>
              <Input
                id="name"
                name="name"
                placeholder="Ej: Familia García"
                required
                minLength={2}
                maxLength={40}
              />
            </div>
            <Button type="submit" className="w-full" disabled={createPending}>
              {createPending ? "Creando..." : "Crear mi grupo"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="relative flex items-center justify-center">
        <Separator />
        <span className="absolute bg-background px-3 text-xs text-muted-foreground">
          o
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersRound className="h-5 w-5 text-primary" />
            Unirme a un grupo
          </CardTitle>
          <CardDescription>
            Pide el código de invitación a quien creó el grupo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={joinAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código de invitación</Label>
              <Input
                id="code"
                name="code"
                placeholder="Ej: K7F2XN"
                required
                maxLength={6}
                className="text-center font-mono text-lg tracking-[0.3em] uppercase"
              />
            </div>
            <Button type="submit" variant="outline" className="w-full" disabled={joinPending}>
              {joinPending ? "Entrando..." : "Unirme con el código"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
