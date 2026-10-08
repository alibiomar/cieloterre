import { notFound } from "next/navigation";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { getPublicAgentBySlug } from "@/lib/supabase/queries";
import { whatsappHref } from "@/lib/format";
import { SafeImage } from "@/components/safe-image";
import { InquiryForm } from "@/components/site/inquiry-form";
import { Breadcrumbs } from "@/components/site/ui";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const agent = await getPublicAgentBySlug((await params).slug);
  if (!agent) return { title: "Conseiller immobilier" };
  const description = agent.bio || `${agent.name}, ${agent.role.toLowerCase()} chez CieloTerre. Parle ${agent.languages.join(", ")}.`;
  return {
    title: `${agent.name}, ${agent.role.toLowerCase()}`,
    description,
    openGraph: { title: `${agent.name} | CieloTerre`, description, images: agent.image ? [{ url: agent.image }] : [] },
  };
}

export default async function AgentPage({ params }: { params: Promise<Params> }) {
  const agent = await getPublicAgentBySlug((await params).slug);
  if (!agent) notFound();
  const wa = whatsappHref(agent.phone, `Bonjour ${agent.name}, je vous contacte depuis le site CieloTerre.`);

  return (
    <div className="ct-wrap pb-24 pt-28 md:pt-36">
      <Breadcrumbs items={[{ label: "Conseillers", href: "/agents" }, { label: agent.name }]} />
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-20">
        <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-md bg-ombre lg:mx-0">
          <SafeImage src={agent.image} alt={agent.name} fill preload sizes="(max-width: 1024px) 90vw, 36vw" className="object-cover" />
        </div>
        <div>
          <p className="ct-label">{agent.role}{agent.city ? `, ${agent.city}` : ""}</p>
          <h1 className="ct-display mt-3 text-[clamp(2.4rem,5.5vw,4.6rem)]">{agent.name}</h1>
          <p className="ct-read mt-6 max-w-xl text-[1.2rem] text-encre/85">
            {agent.bio || "Un accompagnement personnalisé pour avancer sereinement dans votre projet immobilier."}
          </p>
          <p className="mt-6 text-muted">Parle {agent.languages.join(", ")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {agent.phone && <a href={`tel:${agent.phone.replace(/\s/g, "")}`} className="ct-btn ct-btn--primary"><Phone size={17} aria-hidden /> <span className="ct-num">{agent.phone}</span></a>}
            {wa && <a href={wa} target="_blank" rel="noreferrer" className="ct-btn ct-btn--ghost"><MessageCircle size={17} aria-hidden /> WhatsApp</a>}
            {agent.email && <a href={`mailto:${agent.email}`} className="ct-btn ct-btn--ghost"><Mail size={17} aria-hidden /> Écrire</a>}
          </div>
        </div>
      </div>
      <div className="mx-auto mt-24 max-w-2xl">
        <InquiryForm title={`Écrire à ${agent.name.split(" ")[0]}`} topic={`Conseiller ${agent.name}`} />
      </div>
    </div>
  );
}
