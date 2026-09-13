import Link from "next/link";
import { EmptyState } from "@/components/page-sections";
import { PageIntro } from "@/components/property-ui";
import type { Agent } from "@/lib/cieloterre-data";
import { SafeImage as Image } from "@/components/safe-image";

export function AgentsPageContent({ agents }: { agents: Agent[] }) {
  return (
    <div className="mx-auto max-w-[1320px]">
      <PageIntro
        eyebrow="Les visages CieloTerre"
        title={
          <>
            Derrière chaque projet, une <em>personne.</em>
          </>
        }
      >
        Une équipe de conseillers qui connaît les lieux, écoute les projets et
        reste présente jusqu’au bout.
      </PageIntro>
      {agents.length ? (
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {agents.map((agent) => (
            <Link
              href={`/agents/${agent.slug}`}
              key={agent.slug}
              className="group"
            >
              <div className="luxury-card relative aspect-[.9] overflow-hidden bg-surface">
                <Image
                  src={agent.image}
                  alt={agent.name}
                  width={800}
                  height={900}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-earth/80 to-transparent p-5 pt-20 text-primary-foreground">
                  <span className="text-xs uppercase tracking-[0.2em]">{agent.city}</span>
                </div>
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-widest text-accent">
                {agent.role}
              </p>
              <h2 className="mt-2 font-serif text-3xl">{agent.name}</h2>
              <p className="mt-2 text-sm text-soft-foreground">{agent.languages.join(" · ")}</p>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-soft-foreground">{agent.bio || "Un accompagnement attentif pour vos projets immobiliers."}</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-12">
          <EmptyState
            title="Une équipe à votre écoute."
            text="Les profils de nos conseillers seront bientôt présentés ici."
            href="/contact"
            action="Parler à un conseiller"
          />
        </div>
      )}
    </div>
  );
}
