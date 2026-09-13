import { PageShell } from "@/components/site-chrome";
import { getPublishedProperties, toPropertyCard } from "@/lib/supabase/queries";
import { BuyPageContent } from "@/components/acheter/buy-page-content";

export default async function BuyPage() {
  const properties = (await getPublishedProperties({ transaction: "sale" })).map(toPropertyCard);

  return (
    <PageShell>
      <div className="mx-auto max-w-[1320px]">
        <BuyPageContent properties={properties} />
      </div>
    </PageShell>
  );
}
export const metadata = { title: "Acheter un bien en Tunisie | CieloTerre" };
