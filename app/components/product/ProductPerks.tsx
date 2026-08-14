export function ProductPerks() {
  return (
    <ul className="mt-6 space-y-2 text-sm text-slate-600">
      {/*
        The Icon component (app/components/ui/icons) is broken today — it
        casts a Vite-imported SVG file path to a React component, which
        crashes at render. Using plain glyphs here until that's fixed.
      */}
      <li className="flex items-center gap-2">
        <span aria-hidden="true">🚚</span>
        Free shipping on orders over $500
      </li>
      <li className="flex items-center gap-2">
        <span aria-hidden="true">🧪</span>
        Batch-tested &middot; Certificate of Analysis available
      </li>
      <li className="flex items-center gap-2">
        <span aria-hidden="true">&#8630;</span>
        Returns accepted within 30 days
      </li>
    </ul>
  );
}
