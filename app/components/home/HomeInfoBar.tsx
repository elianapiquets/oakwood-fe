const INFO_BAR_ITEMS = [
  'Order Online',
  'Live Stock',
  'Chat with a Sales Representative',
];

export function HomeInfoBar() {
  return (
    <div className="w-full bg-blue-800 px-6 py-4">
      <ul className="flex flex-wrap items-center justify-center gap-3 text-sm font-semibold text-white">
        {INFO_BAR_ITEMS.map((item, index) => (
          <li key={item} className="flex items-center gap-3">
            {index > 0 && <span className="text-white/40">|</span>}
            <span className="flex items-center gap-2">
              <span
                className="h-1.5 w-1.5 rounded-full bg-teal"
                aria-hidden="true"
              />
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
