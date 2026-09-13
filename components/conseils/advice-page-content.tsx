import Link from "next/link";
import { EmptyState } from "@/components/page-sections";
import { PageIntro } from "@/components/property-ui";
import type { Article } from "@/lib/cieloterre-data";
import Image from "next/image";

export function AdvicePageContent({ articles }: { articles: Article[] }) {
  return (
    <div className="mx-auto max-w-[1320px]">
      <PageIntro
        eyebrow="L’œil CieloTerre"
        title={
          <>
            Nos <em>conseils.</em>
          </>
        }
      >
        Des histoires de lieux, des repères pour vos projets et un regard sur
        l’art de vivre tunisien.
      </PageIntro>
      {articles.length ? (
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {articles.map((article) => (
            <Link
              href={`/conseils/${article.slug}`}
              key={article.slug}
              className="group"
            >
              <div className="luxury-card aspect-[1.2] overflow-hidden">
                <Image
                  src={article.image}
                  alt={article.title}
                  width={1200}
                  height={1000}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-widest text-accent">
                {article.category} · {article.readTime}
              </p>
              <h2 className="mt-2 font-serif text-3xl leading-tight">
                {article.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-soft-foreground">
                {article.excerpt}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-12">
          <EmptyState
            title="Des histoires à venir."
            text="Nos conseils sur l’immobilier et l’art de vivre tunisien seront bientôt publiés."
            href="/contact"
            action="Nous écrire"
          />
        </div>
      )}
    </div>
  );
}
