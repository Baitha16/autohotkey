export function ConfirmModal({ state, close }) {
  if (!state) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={close}>
      <div
        className="mx-4 w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-slate-900">Confirm</h3>
        <p className="mt-2 text-sm text-slate-500">{state.msg}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={() => { state.resolve(false); close(); }}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
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

  useEffect(() => {
    if (state) setVal(state.def);
  }, [state]);

  if (!state) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={close}>
      <div
        className="mx-4 w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-slate-900">{state.msg}</h3>
        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-medium text-slate-500">Duration (days)</label>
          <input
            type="number"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            min={1}
            autoFocus
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={() => { state.resolve(null); close(); }}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() => { state.resolve(val); close(); }}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-400"
          >
            Extend
          </button>
        </div>
      </div>
    </div>
  );
}
