import { CatalogPage } from "@/components/site/catalog-page";

export const metadata = { title: "Programmes neufs en Tunisie" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <CatalogPage
      searchParams={await searchParams}
      basePath="/neuf"
      locked="new"
      title="Les programmes neufs"
      lede="Des résidences pensées pour les nouveaux usages et une autre idée du confort."
    />
  );
}
