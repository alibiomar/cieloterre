import { CatalogPage } from "@/components/site/catalog-page";

export const metadata = { title: "Biens immobiliers en Tunisie" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <CatalogPage
      searchParams={await searchParams}
      basePath="/biens"
      title="Tous nos biens"
      lede="Appartements, villas, maisons et programmes neufs publiés par nos agences en Tunisie."
    />
  );
}
