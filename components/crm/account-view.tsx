"use client";

import { useEffect, useState } from "react";
import { Bell, Pencil, UserRound } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SecureUpload } from "./secure-upload";
import { fieldClass, labelClass, Modal } from "./ui";

type Account = { full_name: string | null; phone: string | null; role: string; email: string; avatar_path: string | null; preferences: { email_notifications?: boolean; compact_mode?: boolean } | null };

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  agency_admin: "Responsable d'agence",
  agent: "Agent immobilier",
};

export function AccountView({ notify }: { notify: (message: string) => void }) {
  const [account, setAccount] = useState<Account>({ full_name: "", phone: "", role: "", email: "", avatar_path: null, preferences: {} });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  useEffect(() => {
    void fetch("/api/crm/account").then(async (response) => {
      const result = await response.json();
      if (response.ok) setAccount(result.account);
      else notify(result.error ?? "Impossible de charger votre compte.");
      setLoading(false);
    }).catch(() => { notify("Impossible de charger votre compte."); setLoading(false); });
  }, []);

  function update(patch: Partial<Account>) {
    setAccount((current) => ({ ...current, ...patch }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/crm/account", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName: account.full_name, phone: account.phone, email: account.email, avatarPath: account.avatar_path, preferences: account.preferences }) });
      const result = await response.json();
      notify(response.ok ? result.message : result.error ?? "Impossible d'enregistrer votre compte.");
    } catch { notify("Le serveur est indisponible. Réessayez dans un instant."); } finally { setSaving(false); }
  }

  if (loading) return <div className="h-80 animate-pulse rounded-2xl border border-cool-light bg-surface" />;

  const initials = (account.full_name || account.email || "?").trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");

  return (
    <form onSubmit={save} className="max-w-3xl space-y-6">
      <div>
        <p className="eyebrow">Espace personnel</p>
        <h2 className="mt-2 font-serif text-3xl">Mon compte</h2>
        <p className="mt-2 text-sm text-soft-foreground">Gérez vos coordonnées et vos préférences CRM.</p>
      </div>

      <section className="rounded-2xl border border-cool-light bg-background p-6">
        <div className="flex flex-wrap items-center gap-5">
          <div className="relative shrink-0">
            <div className="grid size-16 place-items-center overflow-hidden rounded-full bg-surface text-lg font-semibold text-primary">
              {account.avatar_path && !avatarBroken ? (
                <Image src={account.avatar_path} alt="" width={64} height={64} className="size-full object-cover" onError={() => setAvatarBroken(true)} />
              ) : initials ? (
                <span>{initials}</span>
              ) : (
                <UserRound size={22} />
              )}
            </div>
            <button
              type="button"
              onClick={() => setAvatarModalOpen(true)}
              title="Changer la photo"
              aria-label="Changer la photo"
              className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              <Pencil size={13} />
            </button>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-serif text-xl">{account.full_name || "Votre profil"}</p>
            <p className="mt-1 text-xs text-soft-foreground">{ROLE_LABELS[account.role] ?? account.role}</p>
          </div>
        </div>
      </section>

      {avatarModalOpen && (
        <Modal title="Photo de profil" onClose={() => setAvatarModalOpen(false)}>
          <div className="mt-4">
            <SecureUpload
              accept="image/jpeg,image/png,image/webp"
              label="Photo de profil"
              existingUrl={account.avatar_path}
              onUploaded={(url) => { setAvatarBroken(false); update({ avatar_path: url }); setAvatarModalOpen(false); }}
              onRemoved={() => update({ avatar_path: null })}
              notify={notify}
            />
          </div>
        </Modal>
      )}

      <section className="rounded-2xl border border-cool-light bg-background p-6">
        <p className="text-sm font-semibold">Coordonnées</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="account-name" className={labelClass}>Nom complet</Label>
            <Input id="account-name" className={fieldClass} value={account.full_name ?? ""} onChange={(event) => update({ full_name: event.target.value })} required />
          </div>
          <div>
            <Label htmlFor="account-email" className={labelClass}>Email</Label>
            <Input id="account-email" className={fieldClass} type="email" value={account.email} onChange={(event) => update({ email: event.target.value })} required />
          </div>
          <div>
            <Label htmlFor="account-phone" className={labelClass}>Téléphone</Label>
            <Input id="account-phone" className={fieldClass} type="tel" value={account.phone ?? ""} onChange={(event) => update({ phone: event.target.value })} />
          </div>
          <div>
            <Label className={labelClass}>Rôle</Label>
            <Input className={`${fieldClass} cursor-not-allowed text-soft-foreground`} value={ROLE_LABELS[account.role] ?? account.role} readOnly />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-cool-light bg-background p-6">
        <p className="flex items-center gap-2 text-sm font-semibold"><Bell size={15} /> Notifications</p>
        <label className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-cool-light bg-surface px-4 py-3 text-sm">
          <span>Recevoir les notifications email CRM</span>
          <input
            type="checkbox"
            className="size-4 accent-primary"
            checked={account.preferences?.email_notifications !== false}
            onChange={(event) => update({ preferences: { ...account.preferences, email_notifications: event.target.checked } })}
          />
        </label>
      </section>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer les modifications"}</Button>
      </div>
    </form>
  );
}
