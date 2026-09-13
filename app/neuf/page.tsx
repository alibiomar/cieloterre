import { Header, Footer } from "@/components/site-chrome";
import { getPublishedProperties, toPropertyCard } from "@/lib/supabase/queries";
import { NewPageContent } from "@/components/neuf/new-page-content";

export default async function NewPage() {
  const properties = (await getPublishedProperties({ transaction: "new" })).map(toPropertyCard);

  return (
    <>
      <Header dark />
      <main className="bg-background px-6 pb-24 pt-32 lg:px-10">
        <div className="mx-auto max-w-[1320px]">
          <NewPageContent properties={properties} />
        </div>
      </main>
      <Footer />
    </>
  );
}
export const metadata = { title: "Programmes neufs en Tunisie | CieloTerre" };
