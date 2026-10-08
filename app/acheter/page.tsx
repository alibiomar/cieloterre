import { CatalogPage } from "@/components/site/catalog-page";

export const metadata = { title: "Acheter un bien en Tunisie" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <CatalogPage
      searchParams={await searchParams}
      basePath="/acheter"
      locked="sale"
      title="Acheter en Tunisie"
      lede="De la première visite à la remise des clés, une sélection qui privilégie la justesse plutôt que le volume."
    />
  );
}
