export default function Loading() {
  return (
    <div className="ct-wrap pb-24 pt-32" aria-busy="true" aria-label="Chargement des biens">
      <div className="ct-skeleton h-16 w-2/3 max-w-xl" />
      <div className="ct-skeleton mt-6 h-5 w-1/2 max-w-md" />
      <div className="mt-14 grid gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <div className="ct-skeleton aspect-[4/3]" />
            <div className="ct-skeleton mt-4 h-4 w-1/3" />
            <div className="ct-skeleton mt-3 h-6 w-3/4" />
            <div className="ct-skeleton mt-3 h-5 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
