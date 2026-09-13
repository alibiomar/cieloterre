"use client";

import { useRef, useState } from "react";
import { ImagePlus, UploadCloud, X } from "lucide-react";
import Image from "next/image";

export function SecureUpload({
  accept,
  label,
  existingUrl,
  onUploaded,
  onUploadedPath,
  onRemoved,
  multiple = false,
  notify,
}: {
  accept: string;
  label: string;
  existingUrl?: string | null;
  onUploaded: (url: string) => void;
  onUploadedPath?: (url: string, path: string) => void;
  onRemoved?: (path: string) => void;
  notify: (message: string) => void;
  multiple?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [items, setItems] = useState<{ url: string; path: string; name: string }[]>([]);
  const [existingRemoved, setExistingRemoved] = useState(false);
  const [existingBroken, setExistingBroken] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/crm/uploads", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) {
        notify(result.error ?? "Impossible d'envoyer le fichier.");
        return;
      }
      setItems((current) => [...current, { url: result.url, path: result.path, name: file.name }]);
      onUploadedPath?.(result.url, result.path);
      onUploaded(result.url);
    } catch {
      notify("Le serveur est indisponible. Réessayez dans un instant.");
    } finally {
      setUploading(false);
    }

  }

  async function remove(path: string) {
    const response = await fetch("/api/crm/uploads", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path }) });
    if (!response.ok) {
      notify("Impossible de supprimer ce fichier.");
      return;
    }
    setItems((current) => current.filter((item) => item.path !== path));
    onRemoved?.(path);
  }

  function chooseFiles(files: File[]) {
    if (files.length) void Promise.all(files.map(upload));
  }

  return (
    <div className="block space-y-3 text-sm">
      <span className="font-medium">{label}</span>
      {existingUrl && !existingRemoved && items.length === 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-cool-light bg-background p-2">
          {existingBroken ? (
            <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-surface text-soft-foreground"><ImagePlus size={18} /></div>
          ) : (
            <Image src={existingUrl} alt="" width={48} height={48} className="size-12 rounded-lg object-cover" onError={() => setExistingBroken(true)} />
          )}
          <span className="min-w-0 flex-1 truncate text-xs text-soft-foreground">{existingBroken ? "Image introuvable — envoyez-en une nouvelle" : "Image actuelle"}</span>
          <button
            type="button"
            title="Retirer"
            onClick={() => { setExistingRemoved(true); onRemoved?.(existingUrl); }}
            className="rounded-full p-1 text-soft-foreground hover:bg-surface hover:text-primary"
          >
            <X size={15} />
          </button>
        </div>
      )}
      <button type="button" onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); chooseFiles(Array.from(event.dataTransfer.files)); }} className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-cool-light bg-surface px-5 py-7 text-center transition hover:border-primary hover:bg-background">
        <span className="grid size-11 place-items-center rounded-full bg-background text-primary"><UploadCloud size={21} /></span>
        <span className="font-semibold">Glissez-déposez ou choisissez un fichier</span>
        <span className="text-xs text-soft-foreground">Formats autorisés selon le champ · 8 Mo maximum</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        disabled={uploading}
        onChange={(event) => chooseFiles(Array.from(event.target.files ?? []))}
        className="hidden"
      />
      {uploading && <span className="flex items-center gap-2 text-xs text-soft-foreground"><ImagePlus size={14} /> Envoi sécurisé...</span>}
      {items.length > 0 && <div className="grid gap-2 sm:grid-cols-2">{items.map((item) => <div key={item.path} className="flex items-center gap-2 rounded-xl border border-cool-light bg-background p-2"><Image src={item.url} alt="" width={48} height={48} className="size-12 rounded-lg object-cover" /><span className="min-w-0 flex-1 truncate text-xs">{item.name}</span><button type="button" title="Supprimer" onClick={() => void remove(item.path)} className="rounded-full p-1 text-soft-foreground hover:bg-surface hover:text-primary"><X size={15} /></button></div>)}</div>}
    </div>
  );
}
