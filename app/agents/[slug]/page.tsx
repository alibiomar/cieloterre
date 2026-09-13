import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/site-chrome";
import { Breadcrumbs } from "@/components/property-ui";
import { Mail, Phone } from "lucide-react";
import { getPublicAgentBySlug } from "@/lib/supabase/queries";
import { SafeImage as Image } from "@/components/safe-image";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const agent = await getPublicAgentBySlug((await params).slug);
  if (!agent) {
    return { title: "Conseiller immobilier | CieloTerre" };
  }
  return {
    title: `${agent.name} – ${agent.role} ${agent.city} | CieloTerre`,
    description: agent.bio || `${agent.name}, ${agent.role.toLowerCase()} chez CieloTerre à ${agent.city}. Parle ${agent.languages.join(", ")}.`,
    openGraph: {
      title: `${agent.name} | CieloTerre`,
      description: agent.bio || `${agent.role} à ${agent.city}`,
      images: agent.image ? [{ url: agent.image }] : [],
    },
  };
}

export default async function AgentDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const agent = await getPublicAgentBySlug((await params).slug);
  if (!agent) notFound();
  return (
    <>
      <Header dark />
      <main className="bg-background px-6 pb-24 pt-32 lg:px-10">
        <div className="mx-auto max-w-[1100px]">
          <Breadcrumbs items={["Agents", agent.name]} />
          <div className="grid gap-10 lg:grid-cols-[.8fr_1fr] lg:items-center">
            <div className="aspect-[.9] overflow-hidden rounded-2xl">
              <Image
                src={agent.image}
                alt={agent.name}
                width={800}
                height={900}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="eyebrow">
                {agent.role} · {agent.city}
              </p>
              <h1 className="section-title">{agent.name}</h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-soft-foreground">
                {agent.bio || "Un accompagnement personnalisé pour avancer sereinement dans votre projet immobilier."}
              </p>
              <p className="mt-6 text-sm text-soft-foreground">
                Parle {agent.languages.join(", ")}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {agent.phone && (
                  <a href={`tel:${agent.phone}`} className="inline-flex items-center gap-2 rounded-full border border-cool-light px-5 py-3 text-sm font-semibold">
                    <Phone size={16} /> {agent.phone}
                  </a>
                )}
                {agent.email && (
                  <a href={`mailto:${agent.email}`} className="inline-flex items-center gap-2 rounded-full border border-cool-light px-5 py-3 text-sm font-semibold">
                    <Mail size={16} /> {agent.email}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
