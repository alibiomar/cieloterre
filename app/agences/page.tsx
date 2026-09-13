import { PageShell } from "@/components/site-chrome";
import { AgenciesPageContent } from "@/components/agences/agencies-page-content";
import { getPublicAgencies } from "@/lib/supabase/queries";

export default async function AgenciesPage() {
  const agencies = await getPublicAgencies();
  return (
    <PageShell>
      <AgenciesPageContent agencies={agencies} />
    </PageShell>
  );
}

export const metadata = {
  title: "Nos agences en Tunisie | CieloTerre",
};
