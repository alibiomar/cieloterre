import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/site-chrome";
import { Breadcrumbs } from "@/components/property-ui";
import { getPublicArticleBySlug } from "@/lib/supabase/queries";
import Image from "next/image";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const article = await getPublicArticleBySlug((await params).slug);
  return {
    title: article ? `${article.title} | CieloTerre` : "Conseils | CieloTerre",
    description: article?.excerpt,
  };
}
export default async function ArticleDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const article = await getPublicArticleBySlug((await params).slug);
  if (!article) notFound();
  return (
    <>
      <Header dark />
      <main className="bg-background px-6 pb-24 pt-32 lg:px-10">
        <article className="mx-auto max-w-[960px]">
          <Breadcrumbs items={["Conseils", article.category, article.title]} />
          <p className="eyebrow">
            {article.category} · {article.readTime}
          </p>
          <h1 className="mt-4 max-w-4xl font-serif text-5xl leading-tight text-foreground sm:text-7xl">
            {article.title}
          </h1>
          <p className="mt-6 max-w-2xl text-xl leading-8 text-soft-foreground">
            {article.excerpt}
          </p>
          <Image
            src={article.image}
            alt={article.title}
            width={1400}
            height={780}
            className="mt-12 aspect-[1.8] w-full rounded-2xl object-cover"
          />
          <div className="prose mt-12 max-w-2xl whitespace-pre-line text-soft-foreground">
            {article.body || article.excerpt}
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
