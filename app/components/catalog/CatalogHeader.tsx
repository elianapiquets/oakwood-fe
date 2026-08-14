import {mockCategory} from './mockCatalogData';

export function CatalogHeader() {
  return (
    <div className="rounded bg-navy px-8 py-8">
      <p className="text-xs font-bold uppercase tracking-widest text-teal">
        {mockCategory.eyebrow}
      </p>
      <h1 className="mt-2 text-4xl font-extrabold text-white">
        {mockCategory.title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-slate-300">
        {mockCategory.description}
      </p>
    </div>
  );
}
