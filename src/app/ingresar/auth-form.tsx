"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Wallet } from "lucide-react";

type Mode = "login" | "register";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();

      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        startTransition(() => router.push("/panel"));
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName || email.split("@")[0] },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        if (data.session) {
          // La confirmación de correo está desactivada: sesión inmediata
          startTransition(() => router.push("/bienvenida"));
          router.refresh();
        } else {
          // Se requiere confirmar el correo
          toast.info(
            "¡Cuenta creada! Revisa tu correo y confirma para entrar.",
            { duration: 10000 }
          );
          setMode("login");
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Wallet className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          PlataClara
        </CardTitle>
        <CardDescription>
          {mode === "login"
            ? "Entra para ver las cuentas de tu casa"
            : "Crea tu cuenta gratis y empieza en un minuto"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as Mode)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="register">Crear cuenta</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <EmailPasswordFields
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                autoComplete="current-password"
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Entrar
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="displayName">¿Cómo te llamas?</Label>
                <Input
                  id="displayName"
                  placeholder="Ej: Camila"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoComplete="name"
                />
              </div>
              <EmailPasswordFields
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                autoComplete="new-password"
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear mi cuenta gratis
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Gratis, sin anuncios y sin pedirte nunca las claves de tu banco.
        </p>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          <Link href="/" className="underline-offset-4 hover:underline">
            Volver al inicio
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

function EmailPasswordFields({
  email,
  setEmail,
  password,
  setPassword,
  autoComplete,
}: {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  autoComplete: string;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          type="email"
          placeholder="tucorreo@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete={autoComplete}
        />
      </div>
    </>
  );
}
