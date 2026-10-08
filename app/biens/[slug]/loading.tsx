export default function Loading() {
  return (
    <div className="ct-wrap pb-24 pt-28" aria-busy="true" aria-label="Chargement du bien">
      <div className="ct-skeleton mb-8 h-4 w-64" />
      <div className="ct-skeleton aspect-[4/3] w-full lg:h-[34rem] lg:aspect-auto" />
      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-5">
          <div className="ct-skeleton h-7 w-24" />
          <div className="ct-skeleton h-16 w-3/4" />
          <div className="ct-skeleton h-5 w-1/3" />
          <div className="ct-skeleton mt-10 h-24 w-full" />
        </div>
        <div className="ct-skeleton hidden h-80 lg:block" />
      </div>
    </div>
  );
}
