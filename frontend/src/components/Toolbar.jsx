import { useState, useEffect } from "react";
import { api } from "../lib/api";

const typeOptions = [
  { value: "programs", label: "Programs" },
  { value: "settings", label: "Settings" },
  { value: "cleanup", label: "Clean Up" },
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
  { value: "yearly", label: "Yearly" },
  { value: "lifetime", label: "Lifetime" },
  { value: "trial", label: "Trial" },
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
  trialProgramType,
  setTrialProgramType,
  hwidSlots,
  onHwidSlotsChange,
  search,
  setSearch,
  onGenerate,
  onTrial,
  loading,
  programs,
  programSettings,
  onProgramSettingsChange,
  onSaveSettings,
  settingsSaving,
  onAddProgram,
  onUpdateProgram,
  onDeleteProgram,
  cleanupIntervalDays,
  onSaveCleanupSettings,
  autoCleanupStatus,
  onRunAutoCleanup,
}) {
  const [cleanupDays, setCleanupDays] = useState(cleanupIntervalDays);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#8b5cf6");
  const [newVersion, setNewVersion] = useState("1.0.0");
  const [newLink, setNewLink] = useState("");
  useEffect(() => { setCleanupDays(cleanupIntervalDays); }, [cleanupIntervalDays]);

  useEffect(() => {
    if (programs.length > 0) {
      if (!programType || !programs.some(p => p.name === programType)) setProgramType(programs[0].name);
      if (!trialProgramType || !programs.some(p => p.name === trialProgramType)) setTrialProgramType(programs[0].name);
    }
  }, [programs]);

  const handleSettingChange = (progName, field, value) => {
    onProgramSettingsChange(prev => ({
      ...prev,
      [progName]: { ...(prev[progName] || {}), [field]: value },
    }));
  };

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

        {type === "programs" ? (
          <>
            <div className="flex flex-wrap items-start gap-4">
              {programs.map(p => (
                <div key={p.id} className="flex flex-col gap-1.5 rounded-lg border border-slate-100 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800/50 min-w-[180px]">
                  <div className="flex items-center justify-between gap-1">
                    <input
                      value={p.name}
                      onChange={(e) => onUpdateProgram(p.id, { name: e.target.value })}
                      className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold outline-none focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                    />
                    <button
                      onClick={() => onDeleteProgram(p.id, p.name)}
                      className="shrink-0 flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={p.color}
                      onChange={(e) => onUpdateProgram(p.id, { color: e.target.value })}
                      className="h-6 w-8 cursor-pointer rounded border border-slate-200 p-0 dark:border-slate-600"
                    />
                    <input
                      value={p.color}
                      onChange={(e) => onUpdateProgram(p.id, { color: e.target.value })}
                      placeholder="#hex"
                      className="w-20 rounded border border-slate-200 bg-white px-1.5 py-1 text-xs outline-none focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-2 dark:border-slate-600 dark:bg-slate-800/30">
              <span className="text-xs font-medium text-slate-500">Add:</span>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Name"
                className="w-24 rounded border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
              />
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="h-6 w-8 cursor-pointer rounded border border-slate-200 p-0 dark:border-slate-600"
              />
              <input
                value={newVersion}
                onChange={(e) => setNewVersion(e.target.value)}
                placeholder="1.0.0"
                className="w-16 rounded border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
              />
              <input
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                placeholder="Discord link"
                className="w-32 rounded border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
              />
              <button
                onClick={() => { if (newName.trim()) { onAddProgram(newName.trim(), newColor, newVersion, newLink); setNewName(""); setNewColor("#8b5cf6"); setNewVersion("1.0.0"); setNewLink(""); } }}
                className="rounded-lg bg-indigo-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-400"
              >
                Add
              </button>
            </div>
          </>
        ) : type === "settings" ? (
          <>
            {programs.map(p => {
              const s = programSettings[p.name] || {};
              return (
                <div key={p.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800/50">
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">{p.name}</span>
                  <input
                    value={s.latest_version || ""}
                    onChange={(e) => handleSettingChange(p.name, "latest_version", e.target.value)}
                    placeholder="Version"
                    className="w-24 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500"
                  />
                  <input
                    value={s.discord_link || ""}
                    onChange={(e) => handleSettingChange(p.name, "discord_link", e.target.value)}
                    placeholder="Discord Link"
                    className="w-44 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500"
                  />
                </div>
              );
            })}
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
          </>
        ) : type === "cleanup" ? (
          <>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={cleanupDays}
                onChange={(e) => setCleanupDays(Math.max(1, Math.min(365, +e.target.value || 1)))}
                min="1"
                max="365"
                className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm outline-none transition-colors focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
              />
              <span className="text-xs text-slate-400 dark:text-slate-500">days</span>
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
                      ? `Next: ${d > 0 ? `${d}d ` : ""}${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`
                      : "Not scheduled"}
                  </span>
                  <button
                    onClick={onRunAutoCleanup}
                    className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-900"
                  >
                    Run Now
                  </button>
                </div>
              );
            })()}
          </>
        ) : type === "trial" ? (
          <>
            <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/30 px-2 py-1.5 dark:border-emerald-800 dark:bg-emerald-950/30">
              <input
                type="number"
                value={trialMinutes}
                onChange={(e) => setTrialMinutes(Math.max(1, Math.min(43200, +e.target.value || 1)))}
                min="1"
                max="43200"
                className="w-14 rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
              />
              <span className="text-xs text-slate-400 dark:text-slate-500">min</span>
              <select
                value={trialProgramType}
                onChange={(e) => setTrialProgramType(e.target.value)}
                className="w-28 rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
              >
                {programs.map(p => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
              <button
                onClick={onTrial}
                disabled={loading}
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-900"
              >
                Generate Trial
              </button>
            </div>
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
              type="number"
              value={hwidSlots}
              onChange={(e) => onHwidSlotsChange(Math.max(1, Math.min(10, +e.target.value || 1)))}
              min="1"
              max="10"
              className="w-14 rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
            />
            <span className="text-xs text-slate-400 dark:text-slate-500">slots</span>

            <select
              value={programType}
              onChange={(e) => setProgramType(e.target.value)}
              className="w-28 rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
            >
              {programs.map(p => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>

            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Custom ID"
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
