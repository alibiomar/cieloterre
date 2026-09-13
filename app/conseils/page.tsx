import { Header, Footer } from "@/components/site-chrome";
import { AdvicePageContent } from "@/components/conseils/advice-page-content";
import { getPublicArticles } from "@/lib/supabase/queries";

export default async function AdvicePage() {
  const articles = await getPublicArticles();
  return (
    <>
      <Header dark />
      <main className="bg-background px-6 pb-24 pt-32 lg:px-10">
        <AdvicePageContent articles={articles} />
      </main>
      <Footer />
    </>
  );
}

export const metadata = {
  title: "Conseils immobiliers et art de vivre | CieloTerre",
};
