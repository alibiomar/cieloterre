import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicArticleBySlug, getPublicArticles } from "@/lib/supabase/queries";
import { SafeImage } from "@/components/safe-image";
import { Breadcrumbs, ContactBand } from "@/components/site/ui";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const article = await getPublicArticleBySlug((await params).slug);
  return {
    title: article ? article.title : "Conseils",
    description: article?.excerpt,
    openGraph: article ? { title: article.title, description: article.excerpt, images: [{ url: article.image }] } : undefined,
  };
}

/** Plain-text bodies from the CRM: blank line = paragraph, "## " = subheading. */
function renderBody(body: string) {
  return body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, index) =>
      block.startsWith("## ") ? (
        <h2 key={index}>{block.slice(3)}</h2>
      ) : (
        <p key={index} className="whitespace-pre-line">{block}</p>
      ),
    );
}

export default async function ArticlePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const article = await getPublicArticleBySlug(slug);
  if (!article) notFound();
  const more = (await getPublicArticles().catch(() => [])).filter((item) => item.slug !== article.slug).slice(0, 2);

  return (
    <>
      <article className="ct-wrap pb-24 pt-28 md:pt-36">
        <Breadcrumbs items={[{ label: "Conseils", href: "/conseils" }, { label: article.title }]} />
        <header className="max-w-4xl">
          <p className="text-muted">{article.category}, {article.readTime} de lecture</p>
          <h1 className="ct-display mt-4 text-[clamp(2.4rem,6vw,5rem)]">{article.title}</h1>
          <p className="ct-lede mt-6 max-w-2xl">{article.excerpt}</p>
        </header>
        <div className="relative mt-12 aspect-[16/8] overflow-hidden rounded-md bg-ombre">
          <SafeImage src={article.image} alt="" fill preload sizes="(max-width: 1400px) 96vw, 1300px" className="object-cover" />
        </div>
        <div className="ct-read ct-prose mt-14 text-[1.1875rem] text-encre/90">{renderBody(article.body || article.excerpt)}</div>

        {more.length > 0 && (
          <aside className="mt-24 border-t border-trait pt-12" aria-label="À lire aussi">
            <h2 className="ct-h3">À lire aussi</h2>
            <div className="mt-8 grid gap-8 md:grid-cols-2">
              {more.map((item) => (
                <Link key={item.slug} href={`/conseils/${item.slug}`} className="group block border-t border-trait pt-5">
                  <p className="text-sm text-muted">{item.category}</p>
                  <p className="mt-2 text-2xl font-light tracking-[-0.02em] group-hover:text-porte">{item.title}</p>
                </Link>
              ))}
            </div>
          </aside>
        )}
      </article>
      <ContactBand />
    </>
  );
}
