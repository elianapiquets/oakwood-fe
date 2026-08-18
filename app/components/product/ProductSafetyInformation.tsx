import {RichText} from '@shopify/hydrogen';
import {DownloadIcon} from './DownloadIcon';

export interface SafetyDataSheetData {
  title?: string | null;
  description?: string | null;
  fileUrl?: string | null;
}

export function ProductSafetyInformation({
  data,
}: {
  data: SafetyDataSheetData | null;
}) {
  if (!data) {
    return (
      <p className="text-sm text-slate-400">
        No safety data sheet available for this product.
      </p>
    );
  }

  return (
    <div>
      {data.title && (
        <h4 className="text-sm font-bold text-slate-900">{data.title}</h4>
      )}
      {data.description && (
        <RichText
          data={data.description}
          className="mt-2 text-sm text-slate-600 [&>p+p]:mt-2"
        />
      )}
      {data.fileUrl && (
        <a
          href={data.fileUrl}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded border border-navy px-4 py-2 text-sm font-semibold text-navy hover:bg-slate-50"
        >
          <DownloadIcon />
          Download SDS / MSDS
        </a>
      )}
    </div>
  );
}
