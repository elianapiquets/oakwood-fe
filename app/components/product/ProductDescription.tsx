import {ProductAccordionRow} from './ProductAccordionRow';
import {mockDescription} from './mockProduct';

export function ProductDescription() {
  return (
    <div>
      <ProductAccordionRow title="Description" expanded />
      <div className="grid grid-cols-1 gap-6 py-4 md:grid-cols-[1fr_260px]">
        <div>
          <p className="text-sm text-slate-600">{mockDescription.paragraph}</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {mockDescription.bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2">
                <span
                  className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal"
                  aria-hidden="true"
                />
                {bullet}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="font-mono text-lg text-slate-700">
            H<sup>3</sup>C&equiv;N
          </p>
          <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">
            Structural Formula
          </p>
        </div>
      </div>
    </div>
  );
}
