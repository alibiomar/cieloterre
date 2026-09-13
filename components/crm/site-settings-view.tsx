"use client";

import { useState } from "react";
import { Globe, Image as ImageIcon, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SecureUpload } from "./secure-upload";
import { Modal } from "./ui";

type HeroSettings = { mode?: "auto" | "image" | "property"; imagePath?: string | null; propertyId?: string | null };

export function SiteSettingsView({
  initialSettings,
  properties,
  notify,
}: {
  initialSettings: Record<string, HeroSettings>;
  properties: { id: string; slug: string; title: string; city: string; cover_path: string | null }[];
  notify: (message: string) => void;
}) {
  const [hero, setHero] = useState<HeroSettings>(initialSettings.hero ?? { mode: "auto", imagePath: null, propertyId: null });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save(next: HeroSettings) {
    setSaving(true);
    try {
      const response = await fetch("/api/crm/site-settings", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "hero", value: next }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setHero(next);
      notify("Page d'accueil mise à jour.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Enregistrement impossible.");
    } finally { setSaving(false); }
  }

  const selected = properties.find((property) => property.id === hero.propertyId);

  return (
    <div className="space-y-8">
      <section>
        <p className="eyebrow">Site public</p>
        <h2 className="mt-2 font-serif text-2xl">Section héro de la page d'accueil</h2>
        <p className="mt-2 max-w-xl text-sm text-soft-foreground">Choisissez l'image d'ouverture du site, ou mettez en avant un bien publié. En mode automatique, le premier bien de la sélection est utilisé.</p>
      </section>

      <section className="grid gap-4 rounded-2xl border border-cool-light bg-background p-6 lg:grid-cols-3">
        {([
          { mode: "auto", label: "Automatique", hint: "Premier bien de la sélection", icon: Globe },
          { mode: "image", label: "Image libre", hint: "Téléversez une image d'ambiance", icon: ImageIcon },
          { mode: "property", label: "Mettre en avant un bien", hint: "Choisissez un bien publié", icon: Building2 },
        ] as const).map((option) => (
          <button key={option.mode} type="button" disabled={saving} onClick={() => {
            if (option.mode === "property") setPickerOpen(true);
            else void save({ ...hero, mode: option.mode });
          }} className={`rounded-2xl border p-5 text-left transition ${hero.mode === option.mode ? "border-primary bg-surface" : "border-cool-light hover:border-primary/50"}`}>
            <option.icon size={20} className="text-primary" />
            <p className="mt-3 text-sm font-semibold">{option.label}</p>
            <p className="mt-1 text-xs text-soft-foreground">{option.hint}</p>
            {hero.mode === option.mode && <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-primary">Actif</p>}
          </button>
        ))}
      </section>

      {hero.mode === "image" && (
        <section className="rounded-2xl border border-cool-light bg-background p-6">
          <SecureUpload accept="image/jpeg,image/png,image/webp" label="Image du héro" onUploaded={(url) => void save({ ...hero, imagePath: url })} notify={notify} />
          {hero.imagePath && <p className="mt-3 break-all text-xs text-soft-foreground">{hero.imagePath}</p>}
        </section>
      )}

      {hero.mode === "property" && (
        <section className="rounded-2xl border border-cool-light bg-background p-6">
          {selected ? (
            <div className="flex items-center justify-between gap-4">
              <div><p className="text-sm font-semibold">{selected.title}</p><p className="text-xs text-soft-foreground">{selected.city}</p></div>
              <Button variant="outline" onClick={() => setPickerOpen(true)}>Changer</Button>
            </div>
          ) : <p className="text-sm text-soft-foreground">Aucun bien sélectionné — choisissez-en un.</p>}
        </section>
      )}

      {pickerOpen && (
        <Modal title="Choisir un bien à mettre en avant" onClose={() => setPickerOpen(false)} wide>
          <div className="mt-4 max-h-96 space-y-2 overflow-y-auto pr-1">
            {properties.map((property) => (
              <button key={property.id} type="button" onClick={() => { setPickerOpen(false); void save({ mode: "property", imagePath: hero.imagePath, propertyId: property.id }); }} className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${hero.propertyId === property.id ? "border-primary bg-surface" : "border-cool-light hover:border-primary/50"}`}>
                <span className="font-semibold">{property.title}</span>
                <span className="text-xs text-soft-foreground">{property.city}</span>
              </button>
            ))}
            {!properties.length && <p className="py-6 text-center text-sm text-soft-foreground">Aucun bien publié pour le moment.</p>}
          </div>
        </Modal>
      )}
    </div>
  );
}
