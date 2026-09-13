"use client";

import { useState } from "react";
import { Building2, Pencil, Plus, RefreshCw, ShieldBan, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SecureUpload } from "./secure-upload";
import { Modal, fieldClass, labelClass } from "./ui";

type ProfileRef = { full_name: string | null; phone?: string | null; role: string } | { full_name: string | null; phone?: string | null; role: string }[] | null;

type Agency = { id: string; name: string; slug: string; description?: string | null; city?: string | null; address?: string | null; phone?: string | null; email?: string | null; website?: string | null; logo_path?: string | null };
type Agent = {
  id: string;
  email: string | null;
  agency_id: string | null;
  profiles: ProfileRef;
  bio?: string | null;
  phone?: string | null;
  languages?: string[] | null;
  avatar_path?: string | null;
  is_public?: boolean;
  access_blocked?: boolean;
};

// Supabase returns the embedded relation as an object for a to-one join, but
// as an array in some ambiguous-FK cases — normalize so display never falls
// back to the email just because of the response shape.
function agentProfile(agent: Agent) {
  return Array.isArray(agent.profiles) ? agent.profiles[0] ?? null : agent.profiles;
}
function agentDisplayName(agent: Agent) {
  return agentProfile(agent)?.full_name ?? agent.email ?? "Agent";
}

const emptyAgencyForm = { name: "", description: "", city: "", address: "", phone: "", email: "", website: "", logoPath: "" };
const emptyAgentForm = { fullName: "", email: "", phone: "", bio: "", languages: "Français, Arabe", agencyId: "", avatarPath: "", isPublic: false };

export function TeamView({
  initialAgencies,
  initialAgents,
  notify,
}: {
  initialAgencies: Agency[];
  initialAgents: Agent[];
  notify: (message: string) => void;
}) {
  const [agencies, setAgencies] = useState(initialAgencies);
  const [agents, setAgents] = useState(initialAgents);
  const [showAgencyModal, setShowAgencyModal] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [deletingAgency, setDeletingAgency] = useState<Agency | null>(null);
  const [deletingAgent, setDeletingAgent] = useState<Agent | null>(null);
  const [viewingAgent, setViewingAgent] = useState<Agent | null>(null);
  const agencyOf = (agent: Agent) => agencies.find((agency) => agency.id === agent.agency_id) ?? null;

  async function removeAgency() {
    if (!deletingAgency) return;
    const agency = deletingAgency;
    const response = await fetch("/api/crm/team", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "agency", id: agency.id }),
    });
    const result = await response.json();
    if (!response.ok) return notify(result.error ?? "Impossible de supprimer l'agence.");
    setAgencies((current) => current.filter((item) => item.id !== agency.id));
    setAgents((current) => current.map((item) => item.agency_id === agency.id ? { ...item, agency_id: null } : item));
    setDeletingAgency(null);
    notify("Agence supprimée. Les agents sont maintenant libres.");
  }

  async function removeAgent() {
    if (!deletingAgent) return;
    const agent = deletingAgent;
    const response = await fetch("/api/crm/team", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: agent.id }) });
    const result = await response.json();
    if (!response.ok) return notify(result.error ?? "Impossible de retirer l'agent.");
    setAgents((current) => current.filter((item) => item.id !== agent.id));
    setDeletingAgent(null);
    notify("Agent retiré.");
  }

  async function resendInvitation(agent: Agent) {
    const response = await fetch("/api/crm/team", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "resend", id: agent.id }) });
    const result = await response.json();
    notify(response.ok ? result.message : result.error ?? "Impossible de renvoyer l'invitation.");
  }

  async function togglePublic(agent: Agent) {
    const response = await fetch("/api/crm/team", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "visibility", id: agent.id, isPublic: !agent.is_public }) });
    const result = await response.json();
    if (!response.ok) return notify(result.error ?? "Impossible de modifier la visibilité.");
    setAgents((current) => current.map((item) => item.id === agent.id ? { ...item, is_public: result.agent.is_public } : item));
    notify(result.agent.is_public ? "Agent affiché sur le site." : "Agent masqué du site.");
  }

  async function toggleAccess(agent: Agent) {
    const response = await fetch("/api/crm/team", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "access", id: agent.id, blocked: !agent.access_blocked }) });
    const result = await response.json();
    if (!response.ok) return notify(result.error ?? "Impossible de modifier l'accès.");
    setAgents((current) => current.map((item) => item.id === agent.id ? { ...item, access_blocked: result.agent.access_blocked } : item));
    notify(result.agent.access_blocked ? "Accès CRM suspendu pour cet agent." : "Accès CRM rétabli.");
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="eyebrow">Organisation</p>
            <h2 className="mt-2 font-serif text-2xl">Agences</h2>
          </div>
          <Button onClick={() => setShowAgencyModal(true)}><Plus size={16} /> Nouvelle agence</Button>
        </div>
        {agencies.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-cool-light p-6 text-center text-sm text-soft-foreground">Aucune agence pour le moment.</p>
        ) : (
          <div className="mt-4 divide-y divide-cool-light rounded-2xl border border-cool-light bg-background">
            {agencies.map((agency) => (
              <div key={agency.id} className="flex items-center gap-3 px-5 py-4">
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface text-primary"><Building2 size={16} /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{agency.name}</p>
                  <p className="mt-0.5 truncate text-xs text-soft-foreground">{agency.phone || agency.email || "Coordonnées à compléter"}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" title="Modifier" aria-label="Modifier" className="rounded-lg p-2 text-soft-foreground hover:bg-surface hover:text-primary" onClick={() => setEditingAgency(agency)}><Pencil size={15} /></button>
                  <button type="button" title="Supprimer" aria-label="Supprimer" className="rounded-lg p-2 text-soft-foreground hover:bg-surface hover:text-destructive" onClick={() => setDeletingAgency(agency)}><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="eyebrow">Équipe</p>
            <h2 className="mt-2 font-serif text-2xl">Agents</h2>
          </div>
          <Button onClick={() => setShowAgentModal(true)} disabled={!agencies.length} title={agencies.length ? undefined : "Créez une agence d'abord"}><Plus size={16} /> Inviter un agent</Button>
        </div>
        {agents.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-cool-light p-6 text-center text-sm text-soft-foreground">Aucun agent pour le moment.</p>
        ) : (
          <div className="mt-4 divide-y divide-cool-light rounded-2xl border border-cool-light bg-background">
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-center gap-3 px-5 py-4">
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface text-primary"><UserRound size={16} /></div>
                <button
                  type="button"
                  onClick={() => setViewingAgent(agent)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="flex items-center gap-2 truncate text-sm font-semibold">
                    {agentDisplayName(agent)}
                    {agent.access_blocked && <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive">Accès bloqué</span>}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-soft-foreground">{agencies.find((agency) => agency.id === agent.agency_id)?.name ?? "Sans agence"}</p>
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" title={agent.is_public ? "Masquer du site" : "Afficher sur le site"} onClick={() => void togglePublic(agent)} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${agent.is_public ? "bg-surface text-primary" : "text-soft-foreground"}`}>{agent.is_public ? "Publié" : "Masqué"}</button>
                  <button type="button" title="Renvoyer l'invitation" aria-label="Renvoyer l'invitation" className="rounded-lg p-2 text-soft-foreground hover:bg-surface hover:text-primary" onClick={() => void resendInvitation(agent)}><RefreshCw size={15} /></button>
                  <button type="button" title={agent.access_blocked ? "Rétablir l'accès" : "Bloquer l'accès"} aria-label={agent.access_blocked ? "Rétablir l'accès" : "Bloquer l'accès"} onClick={() => void toggleAccess(agent)} className={`rounded-lg p-2 hover:bg-surface ${agent.access_blocked ? "text-destructive" : "text-soft-foreground hover:text-primary"}`}><ShieldBan size={15} /></button>
                  <button type="button" title="Modifier" aria-label="Modifier" className="rounded-lg p-2 text-soft-foreground hover:bg-surface hover:text-primary" onClick={() => setEditingAgent(agent)}><Pencil size={15} /></button>
                  <button type="button" title="Retirer" aria-label="Retirer" className="rounded-lg p-2 text-soft-foreground hover:bg-surface hover:text-destructive" onClick={() => setDeletingAgent(agent)}><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showAgencyModal && (
        <AgencyModal
          onClose={() => setShowAgencyModal(false)}
          onSaved={(agency) => { setAgencies((current) => [...current, agency]); setShowAgencyModal(false); notify("Agence créée."); }}
          notify={notify}
        />
      )}
      {editingAgency && (
        <AgencyModal
          agency={editingAgency}
          onClose={() => setEditingAgency(null)}
          onSaved={(agency) => { setAgencies((current) => current.map((item) => item.id === agency.id ? agency : item)); setEditingAgency(null); notify("Agence modifiée."); }}
          notify={notify}
        />
      )}
      {showAgentModal && (
        <AgentModal
          agencies={agencies}
          onClose={() => setShowAgentModal(false)}
          onCreated={() => {
            setShowAgentModal(false);
            void fetch("/api/crm/team").then((response) => response.ok ? response.json() : null).then((data) => { if (data) setAgents(data.agents); });
          }}
          notify={notify}
        />
      )}
      {editingAgent && (
        <EditAgentModal
          agent={editingAgent}
          onClose={() => setEditingAgent(null)}
          onSaved={(update) => {
            setAgents((current) => current.map((item) => item.id === editingAgent.id
              ? { ...item, bio: update.bio, phone: update.phone, languages: update.languages, avatar_path: update.avatarPath, profiles: item.profiles ? { ...item.profiles, full_name: update.fullName, phone: update.phone } : item.profiles }
              : item));
            setEditingAgent(null);
            notify("Agent modifié.");
          }}
          notify={notify}
        />
      )}
      {deletingAgency && (
        <Modal title="Supprimer l'agence" onClose={() => setDeletingAgency(null)}>
          <p className="mt-4 text-sm leading-6 text-soft-foreground">Supprimer <b>{deletingAgency.name}</b> ? Les agents seront conservés comme agents libres. Cette action ne peut pas être annulée.</p>
          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setDeletingAgency(null)}>Annuler</Button>
            <Button type="button" variant="destructive" onClick={() => void removeAgency()}>Supprimer</Button>
          </div>
        </Modal>
      )}
      {deletingAgent && (
        <Modal title="Retirer l'agent" onClose={() => setDeletingAgent(null)}>
          <p className="mt-4 text-sm leading-6 text-soft-foreground">Retirer <b>{agentDisplayName(deletingAgent)}</b> de l&apos;équipe ? Son accès sera immédiatement révoqué.</p>
          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setDeletingAgent(null)}>Annuler</Button>
            <Button type="button" variant="destructive" onClick={() => void removeAgent()}>Retirer</Button>
          </div>
        </Modal>
      )}
      {viewingAgent && (
        <Modal title={agentDisplayName(viewingAgent)} onClose={() => setViewingAgent(null)}>
          <div className="mt-4 grid gap-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-surface text-primary"><UserRound size={20} /></div>
              <div>
                <p className="font-semibold">{agentDisplayName(viewingAgent)}</p>
                <p className="text-xs text-soft-foreground">{agencyOf(viewingAgent)?.name ?? "Sans agence"}</p>
              </div>
            </div>
            {viewingAgent.email && <p><span className="font-semibold">Email :</span> {viewingAgent.email}</p>}
            {(viewingAgent.phone ?? agentProfile(viewingAgent)?.phone) && (
              <p><span className="font-semibold">Téléphone :</span> {viewingAgent.phone ?? agentProfile(viewingAgent)?.phone}</p>
            )}
            {viewingAgent.languages && viewingAgent.languages.length > 0 && (
              <p><span className="font-semibold">Langues :</span> {viewingAgent.languages.join(", ")}</p>
            )}
            <p><span className="font-semibold">Statut :</span> {viewingAgent.is_public ? "Publié sur le site" : "Masqué du site"}{viewingAgent.access_blocked ? " · Accès CRM bloqué" : ""}</p>
            {viewingAgent.bio && (
              <div>
                <p className="font-semibold">Présentation :</p>
                <p className="mt-1 whitespace-pre-wrap text-soft-foreground">{viewingAgent.bio}</p>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setViewingAgent(null)}>Fermer</Button>
              <Button type="button" onClick={() => { setEditingAgent(viewingAgent); setViewingAgent(null); }}>Modifier</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function AgencyModal({ agency, onClose, onSaved, notify }: { agency?: Agency; onClose: () => void; onSaved: (agency: Agency) => void; notify: (message: string) => void }) {
  const [form, setForm] = useState(agency ? {
    name: agency.name, description: agency.description ?? "", city: agency.city ?? "", address: agency.address ?? "",
    phone: agency.phone ?? "", email: agency.email ?? "", website: agency.website ?? "", logoPath: agency.logo_path ?? "",
  } : emptyAgencyForm);
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/crm/team", {
        method: agency ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agency ? { type: "agency", id: agency.id, ...form } : { type: "agency", ...form }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      onSaved(result.agency);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Impossible d'enregistrer l'agence.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={agency ? "Modifier l'agence" : "Nouvelle agence"} onClose={onClose} wide>
      <form onSubmit={submit} className="mt-6 grid gap-4">
        <div><Label className={labelClass}>Nom</Label><Input className={fieldClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nom de l'agence" required /></div>
        <div><Label className={labelClass}>Description</Label><textarea className={fieldClass} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} maxLength={1000} rows={3} placeholder="Présentation publique" /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label className={labelClass}>Ville</Label><Input className={fieldClass} value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></div>
          <div><Label className={labelClass}>Adresse</Label><Input className={fieldClass} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label className={labelClass}>Téléphone</Label><Input className={fieldClass} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} type="tel" /></div>
          <div><Label className={labelClass}>Email</Label><Input className={fieldClass} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" /></div>
        </div>
        <div><Label className={labelClass}>Site web</Label><Input className={fieldClass} value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} type="url" placeholder="https://..." /></div>
        <SecureUpload
          accept="image/jpeg,image/png,image/webp"
          label="Logo (optionnel)"
          existingUrl={form.logoPath || null}
          onUploaded={(url) => setForm({ ...form, logoPath: url })}
          onRemoved={() => setForm({ ...form, logoPath: "" })}
          notify={notify}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
          <Button type="submit" disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function AgentModal({ agencies, onClose, onCreated, notify }: { agencies: Agency[]; onClose: () => void; onCreated: () => void; notify: (message: string) => void }) {
  const [form, setForm] = useState({ ...emptyAgentForm, agencyId: agencies[0]?.id ?? "" });
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/crm/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "agent",
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          bio: form.bio,
          languages: form.languages.split(",").map((value) => value.trim()).filter(Boolean),
          agencyId: form.agencyId,
          avatarPath: form.avatarPath || null,
          isPublic: form.isPublic,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      notify(result.message);
      onCreated();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Impossible d'envoyer l'invitation.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Inviter un agent" onClose={onClose} wide>
      <form onSubmit={submit} className="mt-6 grid gap-4">
        <div><Label className={labelClass}>Nom complet</Label><Input className={fieldClass} value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required /></div>
        <div><Label className={labelClass}>Email professionnel</Label><Input className={fieldClass} type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></div>
        <div><Label className={labelClass}>Téléphone public</Label><Input className={fieldClass} type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+216 ..." /></div>
        <div><Label className={labelClass}>Présentation publique</Label><textarea className={fieldClass} value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} maxLength={2000} rows={4} placeholder="Présentez cet agent aux visiteurs du site." /></div>
        <div><Label className={labelClass}>Langues</Label><Input className={fieldClass} value={form.languages} onChange={(event) => setForm({ ...form, languages: event.target.value })} placeholder="Français, Arabe" /></div>
        <div><Label className={labelClass}>Agence</Label>
          <select value={form.agencyId} onChange={(event) => setForm({ ...form, agencyId: event.target.value })} required className={fieldClass}>
            <option value="" disabled>Choisir une agence</option>
            {agencies.map((agency) => <option key={agency.id} value={agency.id}>{agency.name}</option>)}
          </select>
        </div>
        <SecureUpload accept="image/jpeg,image/png,image/webp" label="Photo de profil (optionnel)" onUploaded={(url) => setForm({ ...form, avatarPath: url })} notify={notify} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPublic} onChange={(event) => setForm({ ...form, isPublic: event.target.checked })} /> Afficher cet agent sur le site public</label>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
          <Button type="submit" disabled={saving || !form.agencyId}>{saving ? "Envoi..." : "Envoyer l'invitation"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function EditAgentModal({ agent, onClose, onSaved, notify }: {
  agent: Agent;
  onClose: () => void;
  onSaved: (update: { fullName: string; phone: string; bio: string; languages: string[]; avatarPath: string | null }) => void;
  notify: (message: string) => void;
}) {
  const [form, setForm] = useState({
    fullName: agentProfile(agent)?.full_name ?? "",
    phone: agent.phone ?? agentProfile(agent)?.phone ?? "",
    bio: agent.bio ?? "",
    languages: agent.languages?.join(", ") ?? "Français, Arabe",
    avatarPath: agent.avatar_path ?? null as string | null,
  });
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const languages = form.languages.split(",").map((value) => value.trim()).filter(Boolean);
    const response = await fetch("/api/crm/team", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "agent", id: agent.id, fullName: form.fullName, profilePhone: form.phone, phone: form.phone, bio: form.bio, languages, avatarPath: form.avatarPath }),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) return notify(result.error ?? "Impossible d'enregistrer les modifications.");
    onSaved({ fullName: form.fullName, phone: form.phone, bio: form.bio, languages, avatarPath: form.avatarPath });
  }

  return (
    <Modal title="Modifier l'agent" onClose={onClose} wide>
      <form onSubmit={submit} className="mt-6 grid gap-4">
        <div><Label className={labelClass}>Nom complet</Label><Input className={fieldClass} value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required /></div>
        <div><Label className={labelClass}>Téléphone</Label><Input className={fieldClass} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div>
        <div><Label className={labelClass}>Présentation publique</Label><textarea className={fieldClass} value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} maxLength={2000} rows={5} /></div>
        <div><Label className={labelClass}>Langues</Label><Input className={fieldClass} value={form.languages} onChange={(event) => setForm({ ...form, languages: event.target.value })} placeholder="Langues séparées par des virgules" /></div>
        <SecureUpload
          accept="image/jpeg,image/png,image/webp"
          label="Photo de profil"
          existingUrl={form.avatarPath}
          onUploaded={(url) => setForm({ ...form, avatarPath: url })}
          onRemoved={() => setForm({ ...form, avatarPath: null })}
          notify={notify}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
          <Button type="submit" disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</Button>
        </div>
      </form>
    </Modal>
  );
}
