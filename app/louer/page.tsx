import { Header, Footer } from "@/components/site-chrome";
import { getPublishedProperties, toPropertyCard } from "@/lib/supabase/queries";
import { RentPageContent } from "@/components/louer/rent-page-content";

export default async function RentPage() {
  const properties = (await getPublishedProperties({ transaction: "rent" })).map(toPropertyCard);

  return (
    <>
      <Header dark />
      <main className="min-h-screen bg-background px-6 pb-24 pt-32 lg:px-10">
        <div className="mx-auto max-w-[1320px]">
          <RentPageContent properties={properties} />
        </div>
      </main>
      <Footer />
    </>
  );
}
export const metadata = { title: "Louer un bien en Tunisie | CieloTerre" };
