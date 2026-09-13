import { PageShell } from "@/components/site-chrome";
import { FavoritesPageContent } from "@/components/favoris/favorites-page-content";

export default function FavoritesPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-[900px]">
        <FavoritesPageContent />
      </div>
    </PageShell>
  );
}
export const metadata = { title: "Mes favoris | CieloTerre" };
