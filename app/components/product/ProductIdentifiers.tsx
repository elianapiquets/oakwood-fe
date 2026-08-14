import {mockIdentifiers} from './mockProduct';

export function ProductIdentifiers() {
  return (
    <div>
      <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-500">
        Item # {mockIdentifiers.itemNumber}
      </span>
      <h1 className="mt-3 text-2xl font-bold leading-tight text-slate-900">
        {mockIdentifiers.title}
      </h1>
      <div className="mt-3 flex flex-wrap gap-2">
        {mockIdentifiers.chips.map((chip) => (
          <span
            key={chip.label}
            className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs text-slate-600"
          >
            <span className="font-semibold text-slate-500">{chip.label}</span>
            {chip.value}
          </span>
        ))}
      </div>
    </div>
  );
}
