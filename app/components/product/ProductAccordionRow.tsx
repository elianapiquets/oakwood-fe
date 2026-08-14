/**
 * Static header row only — no click handler, no expand/collapse behavior.
 * That interactivity is deferred; see app/components/product/ProductDetailsSection.tsx.
 *
 * Uses a plain glyph instead of the Icon component (app/components/ui/icons)
 * — that component is currently broken (casts a Vite SVG file path to a
 * React component, which crashes at render).
 */
export function ProductAccordionRow({
  title,
  expanded = false,
}: {
  title: string;
  expanded?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 py-4">
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      <span
        aria-hidden="true"
        className={`text-slate-400 ${expanded ? 'rotate-180' : ''}`}
      >
        &#9662;
      </span>
    </div>
  );
}
