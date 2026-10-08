import { FavoritesView } from "@/components/site/favorites-view";
import { PageHeader } from "@/components/site/ui";

export const metadata = { title: "Mes favoris", robots: { index: false } };

export default function FavoritesPage() {
  return (
    <>
      <PageHeader title="Vos biens favoris." lede="Les adresses que vous gardez à l’œil, réunies au même endroit. Elles sont enregistrées sur cet appareil." />
      <section className="ct-wrap pb-24">
        <FavoritesView />
      </section>
    </>
  );
}
