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
