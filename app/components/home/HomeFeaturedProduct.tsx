import {Link} from 'react-router';
import bottlesImage from '~/assets/home-featured-bottles.png';

const FEATURES = [
  'Engineered Solvent Dehydration Systems',
  'Processed at our Estill, SC Facility',
  'Strict Batch-Level Quality Control Testing',
  'Stainless Steel Returnable Packaging',
  'Multiple Volume Options 20L to 200L',
  'Competitively Priced & In-Stock',
  'Fast Domestic Shipping',
];

export function HomeFeaturedProduct() {
  return (
    <div className="grid w-full grid-cols-1 gap-10 px-10 py-16 md:grid-cols-2 md:items-center">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-teal">
          Featured Product
        </p>
        <h2 className="mt-3 text-4xl font-extrabold leading-tight">
          <span className="text-slate-900">Oakwood&apos;s Newest Line of</span>
          <br />
          <span className="text-blue-700">Anhydrous Solvents</span>
        </h2>
        <p className="mt-4 max-w-xl text-slate-600">
          When moisture threatens performance, precision becomes everything.
          Oakwood Chemical removes water from commercial solvents with
          uncompromising accuracy, delivering consistent, verified dryness you
          can trust.
        </p>
        <ul className="mt-5 space-y-2 text-slate-700">
          {FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <span className="mt-1 text-teal" aria-hidden="true">
                &mdash;
              </span>
              {feature}
            </li>
          ))}
        </ul>
        <Link
          to="/collections/anhydrous-solvents"
          className="mt-6 inline-block rounded bg-navy px-6 py-3 text-sm font-bold !text-white hover:bg-navy-dark"
        >
          View Products
        </Link>
      </div>
      <div className="overflow-hidden rounded">
        <img
          src={bottlesImage}
          alt="Amber and clear glass bottles of anhydrous solvents"
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
