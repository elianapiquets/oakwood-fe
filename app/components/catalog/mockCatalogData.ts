export interface MockCollection {
  handle: string;
  title: string;
}

export const mockCollections: MockCollection[] = [
  {handle: 'anhydrous-solvents', title: 'Anhydrous Solvents'},
  {handle: 'boronic-acids-and-esters', title: 'Boronic Acids And Esters'},
  {handle: 'brominated-aromatics', title: 'Brominated Aromatics'},
  {handle: 'peptide-coupling', title: 'Peptide Coupling'},
  {handle: 'fluorinated-amines', title: 'Fluorinated Amines'},
  {handle: 'fluorinated-carboxylic-acids', title: 'Fluorinated Carboxylic Acids'},
  {handle: 'grignard-reagents', title: 'Grignard Reagents'},
  {handle: 'selected-sulfur-compounds', title: 'Selected Sulfur Compounds'},
  {handle: 'reagents-for-oligo-synthesis', title: 'Reagents for Oligo synthesis'},
  {handle: 'reagents-for-synthesis', title: 'Reagents for Synthesis'},
  {handle: 'protecting-groups', title: 'Protecting Groups'},
  {handle: 'solvents', title: 'Solvents'},
  {handle: 'trace-metals-grade-chemicals', title: 'Trace Metals Grade Chemicals'},
];

export interface MockCategory {
  eyebrow: string;
  title: string;
  description: string;
}

export const mockCategory: MockCategory = {
  eyebrow: 'Product Category',
  title: 'Anhydrous Solvents',
  description:
    'Precision-dried solvents processed at our Estill, SC facility. Every batch tested to verified dryness standards.',
};

export interface MockCatalogProduct {
  title: string;
  sku: string;
  purity: string;
  sizes: string[];
}

export const mockCatalogProducts: MockCatalogProduct[] = [
  {
    title: 'Acetonitrile, Anhydrous',
    sku: 'OC-3916',
    purity: '99.8%',
    sizes: ['100 mL', '500 mL', '1 L', '2.5 L'],
  },
  {
    title: 'Dichloromethane, Anhydrous',
    sku: 'OC-4021',
    purity: '99.8%',
    sizes: ['500 mL', '1 L', '2.5 L'],
  },
  {
    title: 'Dimethylformamide, Anhydrous',
    sku: 'OC-4187',
    purity: '99.8%',
    sizes: ['100 mL', '500 mL', '1 L'],
  },
  {
    title: 'Tetrahydrofuran, Anhydrous',
    sku: 'OC-5342',
    purity: '99.9%',
    sizes: ['100 mL', '500 mL', '1 L', '4 L'],
  },
  {
    title: 'Toluene, Anhydrous',
    sku: 'OC-5490',
    purity: '99.8%',
    sizes: ['500 mL', '1 L', '2.5 L'],
  },
  {
    title: 'Diethyl Ether, Anhydrous',
    sku: 'OC-4078',
    purity: '99.7%',
    sizes: ['100 mL', '500 mL', '1 L'],
  },
];
