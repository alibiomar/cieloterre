import { Header, Footer } from "@/components/site-chrome";
import { ManagementPageContent } from "@/components/gestion-locative/management-page-content";

export default function ManagementPage() {
  return (
    <>
      <Header dark />
      <main className="bg-background px-6 pb-24 pt-32 lg:px-10">
        <div className="mx-auto max-w-[1320px]">
          <ManagementPageContent />
        </div>
      </main>
      <Footer />
    </>
  );
}
export const metadata = { title: "Gestion locative en Tunisie | CieloTerre" };
