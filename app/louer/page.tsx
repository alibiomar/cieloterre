import { CatalogPage } from "@/components/site/catalog-page";

export const metadata = { title: "Louer un bien en Tunisie" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <CatalogPage
      searchParams={await searchParams}
      basePath="/louer"
      locked="rent"
      title="Louer en Tunisie"
      lede="Des appartements, maisons et villas à louer, présentés avec transparence."
    />
  );
}
