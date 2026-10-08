import Link from "next/link";
import { getPublicAgents } from "@/lib/supabase/queries";
import { SafeImage } from "@/components/safe-image";
import { ContactBand, EmptyState, PageHeader } from "@/components/site/ui";

export const metadata = { title: "Nos conseillers immobiliers" };

export default async function AgentsPage() {
  const agents = await getPublicAgents().catch(() => []);
  return (
    <>
      <PageHeader title="Derrière chaque projet, une personne." lede="Des conseillers qui connaissent les lieux, écoutent votre projet et restent présents jusqu’au bout." />
      <section className="ct-wrap pb-24">
        {agents.length ? (
          <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
            {agents.map((agent) => (
              <Link key={agent.slug} href={`/agents/${agent.slug}`} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-ombre">
                  <SafeImage src={agent.image} alt={agent.name} fill sizes="(max-width: 640px) 92vw, 22vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04] motion-reduce:transition-none" />
                </div>
                <h2 className="mt-5 text-[1.5rem] font-normal leading-tight tracking-[-0.02em] group-hover:text-porte">{agent.name}</h2>
                <p className="mt-1 text-muted">{agent.role}{agent.city ? `, ${agent.city}` : ""}</p>
                <p className="mt-1 text-sm text-muted">Parle {agent.languages.join(", ")}</p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="Une équipe à votre écoute." text="Les profils de nos conseillers seront bientôt présentés ici. Vous pouvez dès maintenant nous écrire." href="/contact" action="Parler à un conseiller" />
        )}
      </section>
      <ContactBand />
    </>
  );
}
