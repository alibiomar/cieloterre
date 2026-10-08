import Link from "next/link";
import { getPublicArticles } from "@/lib/supabase/queries";
import { SafeImage } from "@/components/safe-image";
import { ContactBand, EmptyState, PageHeader } from "@/components/site/ui";

export const metadata = { title: "Conseils immobiliers et art de vivre" };

export default async function AdvicePage() {
  const articles = await getPublicArticles().catch(() => []);
  const [lead, ...rest] = articles;
  return (
    <>
      <PageHeader title="Conseils pour acheter, louer et vendre." lede="Des repères pour vos projets et un regard sur l’art de vivre tunisien." />
      <section className="ct-wrap pb-24">
        {lead ? (
          <>
            <Link href={`/conseils/${lead.slug}`} className="group grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center lg:gap-14">
              <div className="relative aspect-[3/2] overflow-hidden rounded-md bg-ombre">
                <SafeImage src={lead.image} alt="" fill preload sizes="(max-width: 1024px) 92vw, 56vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03] motion-reduce:transition-none" />
              </div>
              <div>
                <p className="text-sm text-muted">{lead.category}, {lead.readTime} de lecture</p>
                <h2 className="mt-3 text-[clamp(1.9rem,3.4vw,3rem)] font-light leading-[1.05] tracking-[-0.03em] group-hover:text-porte">{lead.title}</h2>
                <p className="ct-read mt-5 text-muted">{lead.excerpt}</p>
              </div>
            </Link>
            {rest.length > 0 && (
              <div className="mt-20 grid gap-x-8 gap-y-14 border-t border-trait pt-14 md:grid-cols-3">
                {rest.map((article) => (
                  <Link key={article.slug} href={`/conseils/${article.slug}`} className="group block">
                    <div className="relative aspect-[3/2] overflow-hidden rounded-md bg-ombre">
                      <SafeImage src={article.image} alt="" fill sizes="(max-width: 768px) 92vw, 30vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04] motion-reduce:transition-none" />
                    </div>
                    <p className="mt-5 text-sm text-muted">{article.category}, {article.readTime} de lecture</p>
                    <h3 className="mt-2 text-[1.5rem] font-normal leading-tight tracking-[-0.02em] group-hover:text-porte">{article.title}</h3>
                    <p className="mt-3 line-clamp-3 text-muted">{article.excerpt}</p>
                  </Link>
                ))}
              </div>
            )}
          </>
        ) : (
          <EmptyState title="Les premiers articles arrivent." text="Nos conseils sur l’achat, la location et la vente en Tunisie seront publiés ici. Une question en attendant ?" href="/contact" action="Nous écrire" />
        )}
      </section>
      <ContactBand />
    </>
  );
}
