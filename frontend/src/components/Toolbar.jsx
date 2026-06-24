import { useState, useEffect } from "react";
import { api } from "../lib/api";

const typeOptions = [
  { value: "settings", label: "Settings" },
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
  { value: "yearly", label: "Yearly" },
  { value: "lifetime", label: "Lifetime" },
];

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
  settingsVersion,
  onSettingsVersionChange,
  settingsLink,
  onSettingsLinkChange,
  onSaveSettings,
  settingsSaving,
  cleanupIntervalDays,
  onSaveCleanupSettings,
  autoCleanupStatus,
  onRunAutoCleanup,
}) {
  const [cleanupDays, setCleanupDays] = useState(cleanupIntervalDays);
  useEffect(() => { setCleanupDays(cleanupIntervalDays); }, [cleanupIntervalDays]);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={type}
          onChange={(e) => onChangeType(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
        >
          {typeOptions.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        {type === "settings" ? (
          <>
            <input
              value={settingsVersion}
              onChange={(e) => onSettingsVersionChange(e.target.value)}
              placeholder="App Version"
              className="w-28 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500"
            />
            <input
              value={settingsLink}
              onChange={(e) => onSettingsLinkChange(e.target.value)}
              placeholder="Discord Link"
              className="w-52 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500"
            />
            <button
              onClick={onSaveSettings}
              disabled={settingsSaving}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              {settingsSaving ? "Saving..." : "Save"}
            </button>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={cleanupDays}
                onChange={(e) => setCleanupDays(Math.max(1, Math.min(365, +e.target.value || 1)))}
                min="1"
                max="365"
                className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm outline-none transition-colors focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
              />
              <span className="text-xs text-slate-400 dark:text-slate-500">days cleanup</span>
              <button
                onClick={() => onSaveCleanupSettings(cleanupDays)}
                className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400 dark:hover:bg-amber-900"
              >
                Set
              </button>
            </div>
            {autoCleanupStatus && (() => {
              const remaining = autoCleanupStatus.next_run
                ? Math.max(0, new Date(autoCleanupStatus.next_run).getTime() - Date.now())
                : 0;
              const d = Math.floor(remaining / 86400000);
              const h = Math.floor((remaining % 86400000) / 3600000);
              const m = Math.floor((remaining % 3600000) / 60000);
              const s = Math.floor((remaining % 60000) / 1000);
              return (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-mono tabular-nums">
                    {autoCleanupStatus.next_run
                      ? `Cleanup: ${d > 0 ? `${d}d ` : ""}${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`
                      : "Cleanup: not scheduled"}
                  </span>
                  <button
                    onClick={onRunAutoCleanup}
                    className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-900"
                  >
                    Run
                  </button>
                </div>
              );
            })()}
          </>
        ) : (
          <>
            {type !== "lifetime" && (
              <>
                <input
                  type="number"
                  value={days}
                  onChange={(e) => onChangeDays(Math.max(1, +e.target.value || 1))}
                  min="1"
                  className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                />
                <span className="text-xs text-slate-400 dark:text-slate-500">days</span>
              </>
            )}

            <input
              value={programType}
              onChange={(e) => setProgramType(e.target.value)}
              placeholder="Program"
              className="w-28 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500"
            />

            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone (optional code)"
              className="w-32 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500"
            />

            <input
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="Owner"
              className="w-28 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500"
            />

            <button
              onClick={onGenerate}
              disabled={loading}
              className="rounded-lg bg-indigo-500 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
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
                className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
              />
              <span className="text-xs text-slate-400 dark:text-slate-500">min</span>
              <button
                onClick={onTrial}
                disabled={loading}
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-900"
              >
                Trial
              </button>
            </div>
          </>
        )}

        <div className="relative ml-auto min-w-[160px] flex-1 sm:flex-initial">
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
            placeholder="Search..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500"
          />
        </div>
      </div>
    </div>
  );
}
