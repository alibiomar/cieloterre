import { PageShell } from "@/components/site-chrome";

export default function Loading() {
  return (
    <PageShell>
      <div className="h-6 w-40 animate-pulse rounded-full bg-surface" />
      <div className="mt-4 h-12 w-2/3 animate-pulse rounded-2xl bg-surface" />
      <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-2xl border border-cool-light">
            <div className="aspect-[.9] w-full animate-pulse bg-surface" />
            <div className="space-y-2 p-5">
              <div className="h-4 w-2/3 animate-pulse rounded bg-surface" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-surface" />
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
