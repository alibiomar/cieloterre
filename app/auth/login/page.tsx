"use client";

import { PageShell } from "@/components/site-chrome";
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
import { useRouter } from "next/navigation";
import { useState } from "react";

// Only the credential/existence signal is genericized — naming it would confirm
// whether an email is registered. Errors the user can act on are passed through,
// and anything unexpected is reported as such instead of as a wrong password.
function loginErrorMessage(error: unknown): string {
  const { code, status } = (error ?? {}) as { code?: string; status?: number };

  if (code === "email_not_confirmed") {
    return "Confirmez votre adresse e-mail — consultez votre boîte de réception.";
  }
  if (code === "over_request_rate_limit" || status === 429) {
    return "Trop de tentatives. Patientez un instant puis réessayez.";
  }
  if (code === "invalid_credentials") {
    return "E-mail ou mot de passe incorrect.";
  }
  return "Une erreur est survenue. Veuillez réessayer.";
}

export default function Page() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/crm");
    } catch (error: unknown) {
      setError(loginErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageShell className="flex items-center justify-center pt-32">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-[28px] border border-cool-light bg-background/90 shadow-[0_18px_60px_rgba(16,43,63,0.08)] backdrop-blur-sm">
          <div className="border-b border-cool-light bg-surface px-6 py-5">
            <p className="eyebrow">Connexion</p>
            <h1 className="mt-2 font-serif text-4xl text-foreground">
              Accédez à votre compte
            </h1>
          </div>
          <div className="p-6 sm:p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button
                type="submit"
                className="w-full bg-earth text-primary-foreground hover:bg-earth"
                disabled={isLoading}
              >
                {isLoading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>
            <p className="mt-5 text-center text-sm text-soft-foreground">
              L&apos;accès est réservé aux administrateurs et agents invités.
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
