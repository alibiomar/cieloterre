import { PageShell } from "@/components/site-chrome";
import { AgentsPageContent } from "@/components/agents/agents-page-content";
import { getPublicAgents } from "@/lib/supabase/queries";

export default async function AgentsPage() {
  const agents = await getPublicAgents();
  return (
    <PageShell>
      <AgentsPageContent agents={agents} />
    </PageShell>
  );
}

export const metadata = {
  title: "Nos agents immobiliers | CieloTerre",
};
