import {ProductAccordionRow} from './ProductAccordionRow';
import {mockPhysicalProperties} from './mockProduct';

export function ProductPhysicalProperties() {
  return (
    <div>
      <ProductAccordionRow title="Physical Properties" expanded />
      <dl className="grid grid-cols-1 gap-y-3 py-4 sm:grid-cols-2">
        {mockPhysicalProperties.map((property) => (
          <div
            key={property.label}
            className="flex items-center justify-between border-b border-slate-100 pb-2 pr-6 text-sm"
          >
            <dt className="text-slate-500">{property.label}</dt>
            <dd className="font-mono text-slate-900">{property.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
