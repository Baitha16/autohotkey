const cards = [
  { key: "total", label: "Total", color: "text-slate-900" },
  { key: "active", label: "Active", color: "text-emerald-600" },
  { key: "expired", label: "Expired", color: "text-red-600" },
  { key: "suspended", label: "Suspended", color: "text-amber-600" },
];

const icons = {
  total: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
  active: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  expired: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  suspended: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z",
};

export default function StatsBar({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map(({ key, label, color }) => (
        <div
          key={key}
          className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900">
                {stats[key]}
              </p>
              <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-slate-400">
                {label}
              </p>
            </div>
            <div className={`rounded-lg p-2 ${key === "total" ? "bg-slate-100" : key === "active" ? "bg-emerald-50" : key === "expired" ? "bg-red-50" : "bg-amber-50"}`}>
              <svg className={`h-4 w-4 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={icons[key]} />
              </svg>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
