import {useState} from 'react';

const THUMBNAILS = ['thumb-1', 'thumb-2', 'thumb-3'];

export function ProductGallery() {
  const [activeThumbnail, setActiveThumbnail] = useState(THUMBNAILS[0]);

  return (
    <div>
      {/* Placeholder for now — a carousel library will replace this. */}
      <div className="flex aspect-square w-full items-center justify-center rounded border border-slate-200 bg-slate-100 text-sm text-slate-400">
        Image placeholder
      </div>
      <div className="mt-3 flex gap-3">
        {THUMBNAILS.map((thumbnail, index) => (
          <button
            key={thumbnail}
            type="button"
            onClick={() => setActiveThumbnail(thumbnail)}
            aria-label={`View image ${index + 1}`}
            className={`flex aspect-square w-20 items-center justify-center rounded border bg-slate-100 text-xs text-slate-400 ${
              thumbnail === activeThumbnail ? 'border-navy' : 'border-slate-200'
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
