"use client";

import { useEffect, useRef, useState } from "react";
import { Building2, ChevronLeft, Download, Eye, FileText, Plus, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SecureUpload } from "./secure-upload";
import { ConfirmButton, Modal, fieldClass, formatDateTime, labelClass } from "./ui";

const CATEGORIES = ["mandat", "contrat", "identite", "financier", "autre"] as const;
type Category = (typeof CATEGORIES)[number];
const CATEGORY_LABELS: Record<Category, string> = {
  mandat: "Mandats",
  contrat: "Contrats",
  identite: "Pièces d'identité",
  financier: "Documents financiers",
  autre: "Autres",
};

type DocumentRow = {
  id: string;
  name: string;
  file_url: string | null;
  generated_body?: string | null;
  category: Category;
  document_type: string;
  signature_status: string;
  agency_id: string | null;
  crm_document_events?: { id: string; event_type: string; actor_email: string | null; created_at: string }[];
};

type AgencySummary = { id: string; name: string; documentCount: number; lastActivity: string | null };

export function DocumentsView({
  notify,
  currentUserId,
  isAdmin,
}: {
  notify: (message: string) => void;
  currentUserId?: string;
  isAdmin?: boolean;
}) {
  const [agencySummaries, setAgencySummaries] = useState<AgencySummary[] | null>(null);
  const [loadingAgencies, setLoadingAgencies] = useState(Boolean(isAdmin));
  const [selectedAgency, setSelectedAgency] = useState<AgencySummary | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setLoadingAgencies(true);
      const response = await fetch("/api/crm/documents/agencies");
      const result = await response.json();
      if (!response.ok) notify(result.error ?? "Impossible de charger les agences.");
      setAgencySummaries(response.ok ? result.agencies : []);
      setLoadingAgencies(false);
    })();
  }, [isAdmin]);

  if (isAdmin && !selectedAgency) {
    return (
      <AgencyPicker
        loading={loadingAgencies}
        agencies={agencySummaries ?? []}
        onSelect={setSelectedAgency}
      />
    );
  }

  return (
    <DocumentsLibrary
      notify={notify}
      isAdmin={Boolean(isAdmin)}
      agencyId={selectedAgency?.id}
      agencyName={selectedAgency?.name}
      onBack={isAdmin ? () => setSelectedAgency(null) : undefined}
    />
  );
}

function AgencyPicker({
  loading,
  agencies,
  onSelect,
}: {
  loading: boolean;
  agencies: AgencySummary[];
  onSelect: (agency: AgencySummary) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-cool-light pb-6 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Documents & signature</p>
          <h2 className="mt-2 font-serif text-4xl tracking-tight">Documents</h2>
          <p className="mt-2 max-w-2xl text-sm text-soft-foreground">
            Chaque agence a sa propre bibliothèque documentaire. Choisissez une agence pour la consulter.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSelect({ id: "all", name: "Toutes les agences", documentCount: 0, lastActivity: null })}
          className="rounded-xl border border-cool-light bg-background px-4 py-2 text-sm font-semibold text-primary hover:border-primary"
        >
          Voir tout
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-soft-foreground">Chargement des agences...</p>
      ) : agencies.length === 0 ? (
        <div className="rounded-2xl border border-cool-light bg-background px-5 py-12 text-center">
          <Building2 className="mx-auto text-soft-foreground" size={28} />
          <p className="mt-3 font-serif text-2xl">Aucune agence</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agencies.map((agency) => (
            <button
              key={agency.id}
              type="button"
              onClick={() => onSelect(agency)}
              className="rounded-2xl border border-cool-light bg-background p-5 text-left transition hover:border-primary hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="grid size-9 place-items-center rounded-lg bg-surface text-primary"><Building2 size={17} /></div>
                {agency.documentCount > 0 && (
                  <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-soft-foreground">{agency.documentCount} document{agency.documentCount > 1 ? "s" : ""}</span>
                )}
              </div>
              <p className="mt-4 font-serif text-xl">{agency.name}</p>
              <p className="mt-1 text-xs text-soft-foreground">
                {agency.lastActivity ? `Dernier ajout ${formatDateTime(agency.lastActivity)}` : "Aucun document"}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentsLibrary({
  notify,
  isAdmin,
  agencyId,
  agencyName,
  onBack,
}: {
  notify: (message: string) => void;
  isAdmin: boolean;
  agencyId?: string;
  agencyName?: string;
  onBack?: () => void;
}) {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DocumentRow | null>(null);
  const [attaching, setAttaching] = useState<DocumentRow | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (agencyId) params.set("agencyId", agencyId);
    const response = await fetch(`/api/crm/documents?${params.toString()}`);
    const result = await response.json();
    if (!response.ok) notify(result.error ?? "Impossible de charger les documents.");
    setDocuments(response.ok ? result.documents : []);
    setLoading(false);
  }

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [agencyId]);

  async function track(documentId: string, type: "viewed" | "downloaded") {
    try {
      await fetch("/api/crm/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: { documentId, type } }),
      });
    } catch {
      notify("L'activité n'a pas pu être enregistrée.");
    }
  }

  async function remove(document: DocumentRow) {
    const response = await fetch(`/api/crm/documents/${document.id}`, { method: "DELETE" });
    const result = await response.json().catch(() => null);
    if (response.ok) {
      setDocuments((prev) => prev.filter((item) => item.id !== document.id));
      notify("Document supprimé.");
    } else notify(result?.error ?? "Impossible de supprimer le document.");
  }

  async function download(document: DocumentRow) {
    if (!document.file_url) {
      const blob = new Blob([document.generated_body ?? ""], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = `${document.name}.txt`;
      link.click();
      URL.revokeObjectURL(url);
      await track(document.id, "downloaded");
      return;
    }
    try {
      const response = await fetch(document.file_url);
      if (!response.ok) throw new Error("download");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = document.name.endsWith(".pdf") ? document.name : `${document.name}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      await track(document.id, "downloaded");
    } catch {
      window.open(document.file_url, "_blank", "noopener,noreferrer");
      notify("Téléchargement direct indisponible : le PDF a été ouvert dans un nouvel onglet.");
    }
  }

  const filtered = activeCategory === "all" ? documents : documents.filter((document) => document.category === activeCategory);
  const countByCategory = (category: Category) => documents.filter((document) => document.category === category).length;

  return (
    <div className="space-y-6">
      <div className="border-b border-cool-light pb-6">
        {onBack && (
          <button type="button" onClick={onBack} className="mb-3 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-soft-foreground hover:text-primary">
            <ChevronLeft size={14} /> Toutes les agences
          </button>
        )}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">Documents & signature</p>
            <h2 className="mt-2 font-serif text-4xl tracking-tight">{agencyName && agencyId !== "all" ? `Documents — ${agencyName}` : "Documents"}</h2>
            <p className="mt-2 max-w-2xl text-sm text-soft-foreground">Consultez, téléchargez et suivez chaque document — uploadé ou généré depuis un modèle.</p>
          </div>
          <Button onClick={() => setShowModal(true)}><Plus size={16} /> Ajouter un PDF</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <CategoryPill active={activeCategory === "all"} label={`Tous (${documents.length})`} onClick={() => setActiveCategory("all")} />
        {CATEGORIES.map((category) => (
          <CategoryPill key={category} active={activeCategory === category} label={`${CATEGORY_LABELS[category]} (${countByCategory(category)})`} onClick={() => setActiveCategory(category)} />
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-cool-light bg-background">
        <div className="border-b border-cool-light px-5 py-4"><h3 className="font-semibold">Bibliothèque documentaire</h3><p className="mt-1 text-xs text-soft-foreground">{filtered.length} document{filtered.length === 1 ? "" : "s"}</p></div>
        {loading ? (
          <p className="px-5 py-10 text-sm text-soft-foreground">Chargement...</p>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-14 text-center"><FileText className="mx-auto text-primary" size={28} /><p className="mt-4 font-serif text-2xl">Aucun document</p><p className="mt-2 text-sm text-soft-foreground">Ajoutez une URL PDF pour commencer.</p></div>
        ) : (
          <div className="divide-y divide-cool-light">{filtered.map((document) => {
            const events = document.crm_document_events ?? [];
            const isGenerated = !document.file_url && Boolean(document.generated_body);
            return <div key={document.id} className="flex items-center gap-4 px-5 py-4">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface text-primary"><FileText size={17} /></div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{document.name}</p>
                <p className="mt-1 text-xs text-soft-foreground">
                  <span className="mr-2 rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">{CATEGORY_LABELS[document.category] ?? document.category}</span>
                  {isGenerated ? "Généré depuis un modèle — " : ""}
                  {document.signature_status === "pending" ? "Signature en attente" : document.signature_status === "signed" ? "Signé" : "Disponible"} · {events.length} activité{events.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex gap-1">
                <button type="button" title="Consulter" aria-label="Consulter" className="rounded-lg p-2 text-soft-foreground hover:bg-surface hover:text-primary" onClick={() => { setSelected(document); void track(document.id, "viewed"); }}><Eye size={17} /></button>
                <button type="button" title="Télécharger" aria-label="Télécharger" className="rounded-lg p-2 text-soft-foreground hover:bg-surface hover:text-primary" onClick={() => void download(document)}><Download size={17} /></button>
                {isGenerated && (
                  <button type="button" title="Attacher le PDF signé" aria-label="Attacher le PDF signé" className="rounded-lg p-2 text-soft-foreground hover:bg-surface hover:text-primary" onClick={() => setAttaching(document)}><UploadCloud size={17} /></button>
                )}
                <ConfirmButton
                  label={<Trash2 size={16} />}
                  confirmLabel="Confirmer ?"
                  onConfirm={() => remove(document)}
                  className="rounded-lg p-2 text-soft-foreground hover:bg-surface hover:text-red-600"
                />
              </div>
            </div>;
          })}</div>
        )}
      </section>
      {showModal && (
        <AddDocumentModal
          notify={notify}
          isAdmin={isAdmin}
          fixedAgencyId={agencyId && agencyId !== "all" ? agencyId : undefined}
          onClose={() => setShowModal(false)}
          onAdded={() => { setShowModal(false); void load(); }}
        />
      )}
      {selected && <DocumentPreview document={selected} onClose={() => setSelected(null)} />}
      {attaching && (
        <AttachPdfModal
          document={attaching}
          notify={notify}
          onClose={() => setAttaching(null)}
          onAttached={() => { setAttaching(null); void load(); }}
        />
      )}
    </div>
  );
}

function CategoryPill({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-cool-light bg-background text-soft-foreground hover:border-primary"}`}
    >
      {label}
    </button>
  );
}

function AddDocumentModal({ notify, isAdmin, fixedAgencyId, onClose, onAdded }: { notify: (message: string) => void; isAdmin: boolean; fixedAgencyId?: string; onClose: () => void; onAdded: () => void }) {
  const [name, setName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [category, setCategory] = useState<Category>("autre");
  const [isLoading, setIsLoading] = useState(false);

  async function addDocument(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    const response = await fetch("/api/crm/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, fileUrl, category, documentType: "other", signatureStatus: "pending", agencyId: fixedAgencyId }),
    });
    const result = await response.json();
    setIsLoading(false);
    if (!response.ok) {
      notify(result.error ?? "Impossible d'ajouter le document.");
      return;
    }
    notify("Document ajouté.");
    onAdded();
  }

  return (
    <Modal title="Ajouter un PDF" onClose={onClose}>
      <form onSubmit={addDocument} className="mt-6 space-y-4">
        <div><Label htmlFor="document-name" className={labelClass}>Nom du document</Label><Input className={fieldClass} id="document-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Mandat de vente — Dupont" required /></div>
        <div>
          <Label htmlFor="document-category" className={labelClass}>Catégorie</Label>
          <select id="document-category" value={category} onChange={(event) => setCategory(event.target.value as Category)} className={fieldClass}>
            {CATEGORIES.map((value) => <option key={value} value={value}>{CATEGORY_LABELS[value]}</option>)}
          </select>
        </div>
        {isAdmin && !fixedAgencyId && (
          <p className="text-xs leading-5 text-accent">Sélectionnez d'abord une agence pour y ajouter un document.</p>
        )}
        <div><Label htmlFor="document-url" className={labelClass}>URL du PDF</Label><Input className={fieldClass} id="document-url" type="url" value={fileUrl} onChange={(event) => setFileUrl(event.target.value)} placeholder="https://..." required /></div>
        <SecureUpload accept="application/pdf" label="Ou téléverser un PDF sécurisé" onUploaded={setFileUrl} notify={notify} />
        <p className="text-xs leading-5 text-soft-foreground">Le fichier est validé côté serveur avant son stockage.</p>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
          <Button type="submit" disabled={isLoading || (isAdmin && !fixedAgencyId)}>{isLoading ? "Ajout..." : "Ajouter au registre"}</Button>
        </div>
      </form>
    </Modal>
  );
}

/** Replaces a template-generated placeholder with the real, signed PDF once the client has printed/signed it. */
function AttachPdfModal({ document, notify, onClose, onAttached }: { document: DocumentRow; notify: (message: string) => void; onClose: () => void; onAttached: () => void }) {
  const [fileUrl, setFileUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function attach(event: React.FormEvent) {
    event.preventDefault();
    if (!fileUrl) return;
    setIsLoading(true);
    const response = await fetch(`/api/crm/documents/${document.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileUrl, signatureStatus: "signed" }),
    });
    const result = await response.json().catch(() => null);
    setIsLoading(false);
    if (!response.ok) {
      notify(result?.error ?? "Impossible d'attacher le PDF.");
      return;
    }
    notify("PDF signé attaché au document.");
    onAttached();
  }

  return (
    <Modal title={`Attacher le PDF — ${document.name}`} onClose={onClose}>
      <form onSubmit={attach} className="mt-6 space-y-4">
        <p className="text-sm text-soft-foreground">
          Une fois le document imprimé et signé par le client, téléversez le scan ici pour remplacer le texte généré par le PDF final.
        </p>
        <SecureUpload accept="application/pdf" label="Téléverser le PDF signé" onUploaded={setFileUrl} notify={notify} />
        {fileUrl && <p className="text-xs text-accent">Fichier prêt à être attaché.</p>}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
          <Button type="submit" disabled={isLoading || !fileUrl}>{isLoading ? "Enregistrement..." : "Attacher le PDF"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function DocumentPreview({ document, onClose }: { document: DocumentRow; onClose: () => void }) {
  if (!document.file_url) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-earth/60 p-4" onClick={onClose}>
        <div className="flex h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-background shadow-2xl" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-cool-light px-5 py-4">
            <div><h3 className="font-semibold">{document.name}</h3><p className="text-xs text-soft-foreground">Document généré depuis un modèle — pas encore de PDF signé</p></div>
            <button type="button" className="text-sm font-semibold text-primary" onClick={onClose}>Fermer</button>
          </div>
          <div className="flex-1 overflow-auto bg-surface p-6">
            <pre className="whitespace-pre-wrap rounded-xl bg-background p-6 font-sans text-sm leading-6 text-foreground shadow">{document.generated_body}</pre>
          </div>
        </div>
      </div>
    );
  }
  return <PdfPreview document={document} onClose={onClose} />;
}

function PdfPreview({ document, onClose }: { document: DocumentRow; onClose: () => void }) {
  const [pages, setPages] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let active = true;
    void import("pdfjs-dist").then(async (pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
      const loadingTask = pdfjs.getDocument({ url: document.file_url! });
      const pdf = await loadingTask.promise;
      if (!active) return;
      setPages(pdf.numPages);
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.25 });
      const canvas = canvasRef.current;
      if (!canvas || !active) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext("2d")!, viewport, canvas }).promise;
    }).catch(() => setPages(0));
    return () => { active = false; };
  }, [document.file_url]);

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-earth/60 p-4" onClick={onClose}><div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-background shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between border-b border-cool-light px-5 py-4"><div><h3 className="font-semibold">{document.name}</h3><p className="text-xs text-soft-foreground">{pages ? `${pages} page${pages > 1 ? "s" : ""} · aperçu de la première page` : "Chargement du PDF..."}</p></div><button type="button" className="text-sm font-semibold text-primary" onClick={onClose}>Fermer</button></div><div className="flex-1 overflow-auto bg-surface p-6"><canvas ref={canvasRef} className="mx-auto max-w-full shadow-lg" /></div></div></div>;
}
