"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function AcceptInvitePage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    if (!accessToken || !refreshToken) {
      router.replace("/auth/error?error=invalid_invite_link");
      return;
    }

    void createClient().auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    }).then(({ error: sessionError }) => {
      if (sessionError) {
        setError("Ce lien d'invitation est invalide ou a expiré.");
      }
      setIsLoading(false);
    });
  }, [router]);

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirmation) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setIsSaving(true);
    setError("");
    const { error: updateError } = await createClient().auth.updateUser({ password });
    if (updateError) {
      setError("Impossible de définir votre mot de passe. Réessayez.");
      setIsSaving(false);
      return;
    }
    const next = new URLSearchParams(window.location.search).get("next");
    router.replace(next || "/crm");
  }

  return (
    <PageShell className="flex items-center justify-center pt-32">
      <div className="w-full max-w-md rounded-[28px] border border-cool-light bg-background p-6 shadow-[0_18px_60px_rgba(16,43,63,0.08)] sm:p-8">
        <p className="eyebrow">Invitation acceptée</p>
        <h1 className="mt-2 font-serif text-4xl">Créer votre mot de passe</h1>
        {isLoading ? (
          <p className="mt-5 text-sm text-soft-foreground">Vérification de votre invitation...</p>
        ) : error && !password ? (
          <p className="mt-5 text-sm text-red-600">{error}</p>
        ) : (
          <form onSubmit={savePassword} className="mt-6 space-y-4">
            <div><Label htmlFor="invite-password">Mot de passe</Label><Input id="invite-password" type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
            <div><Label htmlFor="invite-confirmation">Confirmer le mot de passe</Label><Input id="invite-confirmation" type="password" autoComplete="new-password" minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={isSaving} className="w-full">{isSaving ? "Enregistrement..." : "Accéder au CRM"}</Button>
          </form>
        )}
      </div>
    </PageShell>
  );
}
