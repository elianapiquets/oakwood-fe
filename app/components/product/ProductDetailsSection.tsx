import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '~/components/ui/Accordion/Accordion';
import {ProductDescription} from './ProductDescription';
import {ProductPhysicalProperties} from './ProductPhysicalProperties';
import {
  ProductSafetyInformation,
  type SafetyDataSheetData,
} from './ProductSafetyInformation';
import {
  ProductCertificatesOfAnalysis,
  type CertificateOfAnalysis,
} from './ProductCertificatesOfAnalysis';

// Deferred: real accordion behavior, but no content yet for these sections.
const DEFERRED_SECTIONS = [
  {value: 'technical-information', title: 'Technical Information'},
  {value: 'specifications', title: 'Specifications'},
  {value: 'bse-tse-statement', title: 'BSE / TSE Statement'},
];

export function ProductDetailsSection({
  safetyDataSheet,
  certificatesOfAnalysis,
}: {
  safetyDataSheet: SafetyDataSheetData | null;
  certificatesOfAnalysis: CertificateOfAnalysis[];
}) {
  return (
    <Accordion
      defaultValue={[
        'description',
        'physical-properties',
        'safety-information',
        'certificate-of-analysis',
        ...DEFERRED_SECTIONS.map((section) => section.value),
      ]}
    >
      <AccordionItem value="description">
        <AccordionTrigger className="text-base font-bold text-slate-900 hover:no-underline">
          Description
        </AccordionTrigger>
        <AccordionContent>
          <ProductDescription />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="physical-properties">
        <AccordionTrigger className="text-base font-bold text-slate-900 hover:no-underline">
          Physical Properties
        </AccordionTrigger>
        <AccordionContent>
          <ProductPhysicalProperties />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="safety-information">
        <AccordionTrigger className="text-base font-bold text-slate-900 hover:no-underline">
          Safety Information
        </AccordionTrigger>
        <AccordionContent>
          <ProductSafetyInformation data={safetyDataSheet} />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="certificate-of-analysis">
        <AccordionTrigger className="text-base font-bold text-slate-900 hover:no-underline">
          Certificate of Analysis (CofA)
        </AccordionTrigger>
        <AccordionContent>
          <ProductCertificatesOfAnalysis certificates={certificatesOfAnalysis} />
        </AccordionContent>
      </AccordionItem>

      {DEFERRED_SECTIONS.map((section) => (
        <AccordionItem key={section.value} value={section.value}>
          <AccordionTrigger className="text-base font-bold text-slate-900 hover:no-underline">
            {section.title}
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-slate-400">Content coming soon.</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
