import { api } from "../lib/api";

const typeOptions = ["monthly", "weekly", "lifetime"];

export default function Toolbar({
  type,
  onChangeType,
  days,
  onChangeDays,
  phone,
  setPhone,
  owner,
  setOwner,
  programType,
  setProgramType,
  trialMinutes,
  setTrialMinutes,
  search,
  setSearch,
  onGenerate,
  onTrial,
  loading,
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <select
        value={type}
        onChange={(e) => onChangeType(e.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
      >
        {typeOptions.map((t) => (
          <option key={t}>{t}</option>
        ))}
      </select>

      {type !== "lifetime" && (
        <input
          type="number"
          value={days}
          onChange={(e) => onChangeDays(Math.max(1, +e.target.value || 1))}
          min="1"
          className="w-20 rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
        />
      )}

      <input
        value={programType}
        onChange={(e) => setProgramType(e.target.value)}
        placeholder="Program (optional)"
        className="w-36 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500"
      />

      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone (optional, EZ code)"
        className="w-44 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500"
      />

      <input
        value={owner}
        onChange={(e) => setOwner(e.target.value)}
        placeholder="Owner (optional)"
        className="w-36 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500"
      />

      <button
        onClick={onGenerate}
        disabled={loading}
        className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Generate
      </button>

      <div className="flex items-center gap-1.5">
        <input
          type="number"
          value={trialMinutes}
          onChange={(e) => setTrialMinutes(Math.max(1, Math.min(43200, +e.target.value || 1)))}
          min="1"
          max="43200"
          className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
        />
        <span className="text-xs text-slate-400 dark:text-slate-500">min</span>
        <button
          onClick={onTrial}
          disabled={loading}
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-900"
        >
          Trial
        </button>
      </div>

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
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500"
        />
      </div>
    </div>
  );
}
