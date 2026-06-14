import { api } from "../lib/api";

const typeOptions = ["monthly", "weekly", "lifetime"];

export default function Toolbar({
  type,
  onChangeType,
  days,
  phone,
  setPhone,
  search,
  setSearch,
  onGenerate,
  onTrial,
  loading,
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <select
        value={type}
        onChange={(e) => onChangeType(e.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
      >
        {typeOptions.map((t) => (
          <option key={t}>{t}</option>
        ))}
      </select>

      {type !== "lifetime" && (
        <input
          type="number"
          value={days}
          readOnly
          className="w-16 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm text-slate-500 outline-none"
        />
      )}

      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone (optional, EZ code)"
        className="w-44 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
      />

      <button
        onClick={onGenerate}
        disabled={loading}
        className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Generate
      </button>

      <button
        onClick={onTrial}
        disabled={loading}
        className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Trial 1h
      </button>

      <div className="relative ml-auto min-w-[180px] flex-1 sm:flex-initial">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search licenses..."
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      </div>
    </div>
  );
}
