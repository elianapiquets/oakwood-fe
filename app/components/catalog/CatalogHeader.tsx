export function CatalogHeader({
  title,
  description,
}: {
  title: string;
  description?: string | null;
}) {
  return (
    <div className="rounded bg-navy px-8 py-8">
      <p className="text-xs font-bold uppercase tracking-widest text-teal">
        Product Category
      </p>
      <h1 className="mt-2 text-4xl font-extrabold text-white">{title}</h1>
      {description && (
        <p className="mt-3 max-w-2xl text-sm text-slate-300">{description}</p>
      )}
    </div>
  );
}
