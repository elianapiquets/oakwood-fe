import {DownloadIcon} from './DownloadIcon';

export interface CertificateOfAnalysis {
  id: string;
  lotNumber?: string | null;
  dateIssued?: string | null;
  fileUrl?: string | null;
}

function formatDateIssued(iso?: string | null) {
  if (!iso) return null;
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

export function ProductCertificatesOfAnalysis({
  certificates,
}: {
  certificates: CertificateOfAnalysis[];
}) {
  return (
    <div>
      <h4 className="text-sm font-bold text-slate-900">
        Batch Certificates of Analysis
      </h4>
      <p className="mt-2 text-sm text-slate-600">
        Each lot is individually tested and certified. Download the
        Certificate of Analysis for your specific batch using the lot number
        printed on your product label.
      </p>

      {certificates.length > 0 ? (
        <div className="mt-4 overflow-hidden rounded border border-slate-200">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Lot Number</th>
                <th className="px-4 py-3">Date Issued</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {certificates.map((certificate) => (
                <tr key={certificate.id}>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                    {certificate.lotNumber}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {formatDateIssued(certificate.dateIssued)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {certificate.fileUrl && (
                      <a
                        href={certificate.fileUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded border border-navy px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50"
                      >
                        <DownloadIcon />
                        Download
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-400">
          No certificates of analysis available for this product.
        </p>
      )}

      <p className="mt-4 text-sm text-slate-500">
        Don&apos;t see your lot? Contact us at{' '}
        <a
          href="mailto:quality@oakwoodchemical.com"
          className="text-blue-700 hover:underline"
        >
          quality@oakwoodchemical.com
        </a>{' '}
        or call 1-800-467-3386.
      </p>
    </div>
  );
}
