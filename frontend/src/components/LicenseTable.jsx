import { useState, useMemo, useEffect } from "react";
import { api } from "../lib/api";

const PAGE_SIZE = 15;

function isExpired(expiresAt) {
  return !expiresAt || new Date(expiresAt).getTime() <= Date.now();
}

function CountdownCell({ expiresAt, type }) {
  if (type === "lifetime") return <span>Lifetime</span>;
  if (!expiresAt) return <span className="text-slate-300 dark:text-slate-600">-</span>;

  const calc = () => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return null;
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { d, h, m, s };
  };

  const [time, setTime] = useState(calc);

  useEffect(() => {
    setTime(calc());
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!time) return <span className="text-red-500 font-medium">Expired</span>;

  return (
    <span className="font-mono text-xs tabular-nums">
      {time.d > 0 && `${time.d}d `}{time.h}h {time.m}m {time.s}s
    </span>
  );
}

function StatusCell({ expiresAt, type, status }) {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (status === "suspended") {
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950 dark:text-amber-400 dark:ring-amber-500/30">
        Suspended
      </span>
    );
  }

  const expired = type !== "lifetime" && (!expiresAt || new Date(expiresAt).getTime() <= now);

  if (expired) {
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-950 dark:text-red-400 dark:ring-red-500/30">
        Expired
      </span>
    );
  }

  return (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950 dark:text-emerald-400 dark:ring-emerald-500/30">
        Active
      </span>
  );
}

function formatDate(d) {
  if (!d) return "-";
  const date = new Date(d);
  const now = Date.now();
  const diff = date.getTime() - now;
  const abs = Math.abs(diff);
  const rel =
    abs < 60000
      ? "just now"
      : abs < 3600000
        ? `${Math.floor(abs / 60000)}m`
        : abs < 86400000
          ? `${Math.floor(abs / 3600000)}h`
          : `${Math.floor(abs / 86400000)}d`;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} (${diff > 0 ? "+" : "-"}${rel})`;
}

function copyToClipboard(text, add) {
  navigator.clipboard
    .writeText(text)
    .then(() => add(`Copied: ${text}`), () => add("Copy failed", true));
}

const columns = [
  { key: "license_code", label: "Code", sortable: true },
  { key: "membership_type", label: "Type", sortable: true },
  { key: "owner", label: "Owner", sortable: true },
  { key: "program_type", label: "Program", sortable: true },
  { key: "expires_at", label: "Expires", sortable: true },
  { key: "last_used_at", label: "Last Used", sortable: true },
  { key: "created_at", label: "Created", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "hwid", label: "HWID", sortable: true },
  { key: "actions", label: "Actions", sortable: false },
];

export default function LicenseTable({ licenses, search, add, onAct }) {
  const [sortCol, setSortCol] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!search.trim()) return licenses;
    const q = search.trim().toLowerCase();
    return licenses.filter(
      (l) =>
        l.license_code.toLowerCase().includes(q) ||
        l.membership_type.toLowerCase().includes(q) ||
        l.status.toLowerCase().includes(q) ||
        (l.owner && l.owner.toLowerCase().includes(q)) ||
        (l.program_type && l.program_type.toLowerCase().includes(q))
    );
  }, [licenses, search]);

  function effectiveStatus(l) {
    if (l.status === "suspended") return "suspended";
    if (l.membership_type !== "lifetime" && l.expires_at && new Date(l.expires_at).getTime() <= Date.now()) return "expired";
    return l.status;
  }

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let va = sortCol === "status" ? effectiveStatus(a) : a[sortCol];
      let vb = sortCol === "status" ? effectiveStatus(b) : b[sortCol];
      if (["expires_at", "created_at", "last_used_at"].includes(sortCol)) {
        va = va ? new Date(va).getTime() : 0;
        vb = vb ? new Date(vb).getTime() : 0;
      }
      if (typeof va === "string") va = va.toLowerCase();
      if (typeof vb === "string") vb = vb.toLowerCase();
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortCol, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE) || 1;
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => {
    setPage(0);
  }, [search, sortCol, sortDir]);

  function toggleSort(col) {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  }

  function sortIcon(col) {
    if (sortCol !== col) return null;
    return <span className="ml-1 text-indigo-500">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  if (!licenses.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <p className="text-sm text-slate-400">No licenses yet.</p>
      </div>
    );
  }

  return (
    <>
      {/* --- MOBILE: card layout --- */}
      <div className="space-y-3 sm:hidden">
        {paged.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm text-slate-400">No licenses match your search.</p>
          </div>
        ) : (
          paged.map((l) => (
            <div
              key={l.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  onClick={() => copyToClipboard(l.license_code, add)}
                  className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-slate-700 hover:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-400"
                >
                  {l.license_code}
                  <svg className="h-3 w-3 shrink-0 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                </button>
                <StatusCell expiresAt={l.expires_at} type={l.membership_type} status={l.status} />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <span className="text-slate-400">Type</span><span className="text-slate-700 dark:text-slate-300 capitalize">{l.membership_type}</span>
                <span className="text-slate-400">Owner</span><span className="text-slate-700 dark:text-slate-300 truncate">{l.owner || "-"}</span>
                <span className="text-slate-400">Program</span><span className="text-slate-700 dark:text-slate-300 truncate">{l.program_type || "-"}</span>
                <span className="text-slate-400">Expires</span><CountdownCell expiresAt={l.expires_at} type={l.membership_type} />
                {l.hwid && <><span className="text-slate-400">HWID</span><span className="font-mono text-slate-500 truncate">{l.hwid}</span></>}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3 dark:border-slate-700">
                <button onClick={() => onAct(l.license_code, "update-program", "Program Updated")} className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-violet-50 hover:text-violet-600 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-violet-950 dark:hover:text-violet-400">Program</button>
                <button onClick={() => onAct(l.license_code, "update-owner", "Owner Updated")} className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-teal-50 hover:text-teal-600 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-teal-950 dark:hover:text-teal-400">Owner</button>
                <button disabled={l.status === "expired"} onClick={() => onAct(l.license_code, "extend-license", "Extended")} className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-indigo-950 dark:hover:text-indigo-400">Extend</button>
                {l.hwid && <button onClick={() => onAct(l.license_code, "reset-hwid", "HWID Reset")} className="rounded-md border border-orange-200 px-2 py-1 text-xs font-medium text-orange-600 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950">HWID</button>}
                {l.status === "suspended" ? (
                  <button onClick={() => onAct(l.license_code, "suspend-license", "Unsuspended")} className="rounded-md border border-emerald-200 px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950">Unsuspend</button>
                ) : (
                  <button disabled={l.status === "expired"} onClick={() => onAct(l.license_code, "suspend-license", "Suspended")} className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-amber-50 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-amber-950 dark:hover:text-amber-400">Suspend</button>
                )}
                <button onClick={() => onAct(l.license_code, "delete-license", "Deleted")} className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-red-950 dark:hover:text-red-400">Delete</button>
              </div>
            </div>
          ))
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700">Prev</button>
            <span className="text-xs text-slate-400">Page {page + 1} of {totalPages}</span>
            <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700">Next</button>
          </div>
        )}
      </div>

      {/* --- DESKTOP/TABLET: table layout --- */}
      <div className="hidden sm:block rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800" style={{ overflowX: "auto" }}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/50">
              {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-3 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap ${
                      col.sortable ? "cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200" : ""
                    }`}
                    onClick={() => col.sortable && toggleSort(col.key)}
                  >
                    {col.label}
                    {sortIcon(col.key)}
                  </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-slate-400">
                  No licenses match your search.
                </td>
              </tr>
            ) : (
              paged.map((l) => (
                <tr
                  key={l.id}
                  className="transition-colors hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30"
                >
                  <td className="whitespace-nowrap px-3 py-3">
                    <button
                      onClick={() => copyToClipboard(l.license_code, add)}
                      className="group inline-flex items-center gap-1.5 font-mono text-xs text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"
                    >
                      {l.license_code}
                      <svg
                        className="h-3.5 w-3.5 text-slate-300 transition-opacity group-hover:text-indigo-400 dark:text-slate-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-sm capitalize text-slate-700 dark:text-slate-300">
                    {l.membership_type}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-700 dark:text-slate-300">
                    {l.owner || "-"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-700 dark:text-slate-300">
                    {l.program_type || "-"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-500">
                    <CountdownCell expiresAt={l.expires_at} type={l.membership_type} />
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-500">
                    {l.last_used_at ? formatDate(l.last_used_at) : (
                      <span className="text-slate-300 dark:text-slate-600">Never</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-500">
                    {formatDate(l.created_at)}
                  </td>
                  <td className="px-3 py-3">
                    <StatusCell expiresAt={l.expires_at} type={l.membership_type} status={l.status} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs font-mono text-slate-500 dark:text-slate-400">
                    {l.hwid || <span className="text-slate-300 dark:text-slate-600">-</span>}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onAct(l.license_code, "update-program", "Program Updated")}
                        className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-violet-50 hover:text-violet-600 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-violet-950 dark:hover:text-violet-400"
                      >
                        Program
                      </button>
                      <button
                        onClick={() => onAct(l.license_code, "update-owner", "Owner Updated")}
                        className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-teal-50 hover:text-teal-600 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-teal-950 dark:hover:text-teal-400"
                      >
                        Owner
                      </button>
                      <button
                        disabled={l.status === "expired"}
                        onClick={() => onAct(l.license_code, "extend-license", "Extended")}
                        className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-indigo-950 dark:hover:text-indigo-400"
                      >
                        Extend
                      </button>
                      {l.hwid && (
                        <button
                          onClick={() => onAct(l.license_code, "reset-hwid", "HWID Reset")}
                          className="rounded-md border border-orange-200 px-2 py-1 text-xs font-medium text-orange-600 transition-colors hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950"
                        >
                          HWID
                        </button>
                      )}
                      {l.status === "suspended" ? (
                        <button
                          onClick={() => onAct(l.license_code, "suspend-license", "Unsuspended")}
                          className="rounded-md border border-emerald-200 px-2 py-1 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950"
                        >
                          Unsuspend
                        </button>
                      ) : (
                        <button
                          disabled={l.status === "expired"}
                          onClick={() => onAct(l.license_code, "suspend-license", "Suspended")}
                          className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-amber-50 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-amber-950 dark:hover:text-amber-400"
                        >
                          Suspend
                        </button>
                      )}
                      <button
                        onClick={() => onAct(l.license_code, "delete-license", "Deleted")}
                        className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-red-950 dark:hover:text-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 border-t border-slate-100 px-4 py-3 dark:border-slate-700">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            Prev
          </button>
          <span className="text-xs text-slate-400">
            Page {page + 1} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
    </>
  );
}
