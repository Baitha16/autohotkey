export function ConfirmModal({ state, close }) {
  if (!state) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={close}>
      <div
        className="mx-4 w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Confirm</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{state.msg}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={() => { state.resolve(false); close(); }}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={() => { state.resolve(true); close(); }}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
              state.danger
                ? "bg-red-500 hover:bg-red-400"
                : "bg-indigo-500 hover:bg-indigo-400"
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";

export function PromptModal({ state, close }) {
  const [val, setVal] = useState(state?.def || "");
  const [checks, setChecks] = useState([]);

  useEffect(() => {
    if (state) {
      setVal(state.def);
      if (state.multiple && state.def) {
        try { setChecks(JSON.parse(state.def)); } catch { setChecks([]); }
      } else {
        setChecks([]);
      }
    }
  }, [state]);

  if (!state) return null;

  const label = state.label || "Duration (days)";
  const inputType = state.inputType || "number";
  const buttonLabel = state.buttonLabel || "Extend";
  const options = state.options;
  const multiple = state.multiple;

  const toggleCheck = (opt) => {
    setChecks(prev => prev.includes(opt) ? prev.filter(c => c !== opt) : [...prev, opt]);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={close}>
      <div
        className="mx-4 w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{state.msg}</h3>
        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">{label}</label>
          {multiple && options ? (
            <div className="space-y-2">
              {options.map((o) => (
                <label key={o} className="flex items-center gap-2 cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700">
                  <input
                    type="checkbox"
                    checked={checks.includes(o)}
                    onChange={() => toggleCheck(o)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  {o}
                </label>
              ))}
            </div>
          ) : options ? (
            <select
              value={val}
              onChange={(e) => setVal(e.target.value)}
              autoFocus
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
            >
              {options.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          ) : (
            <input
              type={inputType}
              value={val}
              onChange={(e) => setVal(e.target.value)}
              min={1}
              autoFocus
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
            />
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={() => { state.resolve(null); close(); }}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={() => { state.resolve(multiple ? checks : val); close(); }}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-400"
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
