import {ProductDescription} from './ProductDescription';
import {ProductPhysicalProperties} from './ProductPhysicalProperties';
import {ProductAccordionRow} from './ProductAccordionRow';

// Deferred: static headers only, no collapse behavior and no content yet.
const DEFERRED_SECTIONS = [
  'Safety Information',
  'Certificate of Analysis (CofA)',
  'Technical Information',
  'Specifications',
  'BSE / TSE Statement',
];

export function ProductDetailsSection() {
  return (
    <div>
      <ProductDescription />
      <ProductPhysicalProperties />
      {DEFERRED_SECTIONS.map((title) => (
        <ProductAccordionRow key={title} title={title} />
      ))}
    </div>
  );
}
