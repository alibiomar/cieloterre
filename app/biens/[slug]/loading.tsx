import { Header } from "@/components/site-chrome";

export default function LoadingPropertyDetail() {
  return (
    <>
      <Header dark />
      <main className="bg-background px-6 pb-24 pt-32 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="h-4 w-64 animate-pulse rounded-full bg-surface" />
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.25fr_.75fr]">
            <div className="aspect-[1.2] w-full animate-pulse rounded-2xl bg-surface" />
            <div className="space-y-4">
              <div className="h-8 w-3/4 animate-pulse rounded bg-surface" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-surface" />
              <div className="h-10 w-1/3 animate-pulse rounded bg-surface" />
              <div className="h-40 w-full animate-pulse rounded-2xl bg-surface" />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
