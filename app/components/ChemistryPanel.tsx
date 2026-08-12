type HazmatInfo = {
  unNumber: string;
  hazardClass: string;
  packingGroup: string;
  properShippingName: string;
};

export type ChemistryInfo = {
  casNumber: string | null;
  molecularFormula: string | null;
  molecularWeight: string | null;
  purity: string | null;
  boilingPoint: string | null;
  meltingPoint: string | null;
  flashPoint: string | null;
  appearance: string | null;
  storageConditions: string | null;
  hazmat: HazmatInfo | null;
};

type Field = {label: string; value: string | null | undefined};

export function ChemistryPanel({data}: {data: ChemistryInfo}) {
  const fields: Field[] = [
    {label: 'CAS Number', value: data.casNumber},
    {label: 'Molecular Formula', value: data.molecularFormula},
    {label: 'Molecular Weight', value: data.molecularWeight},
    {label: 'Purity', value: data.purity},
    {label: 'Boiling Point', value: data.boilingPoint},
    {label: 'Melting Point', value: data.meltingPoint},
    {label: 'Flash Point', value: data.flashPoint},
    {label: 'Appearance', value: data.appearance},
    {label: 'Storage', value: data.storageConditions},
  ].filter((f): f is {label: string; value: string} => Boolean(f.value));

  if (fields.length === 0 && !data.hazmat) return null;

  return (
    <div className="chemistry-panel">
      <div className="chemistry-panel-title">Chemical Properties</div>

      {fields.length > 0 && (
        <dl className="chemistry-fields">
          {fields.map((f) => (
            <div key={f.label} className="chemistry-field">
              <dt className="chemistry-field-label">{f.label}</dt>
              <dd className="chemistry-field-value">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {data.hazmat && (
        <div className="chemistry-hazmat">
          <div className="chemistry-hazmat-title">
            <span className="chemistry-hazmat-badge">⚠ HAZMAT</span>
            Shipping Classification
          </div>
          <dl className="chemistry-fields">
            <div className="chemistry-field">
              <dt className="chemistry-field-label">UN Number</dt>
              <dd className="chemistry-field-value">{data.hazmat.unNumber}</dd>
            </div>
            <div className="chemistry-field">
              <dt className="chemistry-field-label">Hazard Class</dt>
              <dd className="chemistry-field-value">{data.hazmat.hazardClass}</dd>
            </div>
            <div className="chemistry-field">
              <dt className="chemistry-field-label">Packing Group</dt>
              <dd className="chemistry-field-value">{data.hazmat.packingGroup}</dd>
            </div>
            <div className="chemistry-field">
              <dt className="chemistry-field-label">Proper Shipping Name</dt>
              <dd className="chemistry-field-value">
                {data.hazmat.properShippingName}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
