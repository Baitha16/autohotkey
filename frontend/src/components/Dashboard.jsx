import { useState, useEffect, useMemo, useCallback } from "react";
import { api, clearApiKey } from "../lib/api";
import Toast from "./Toast";
import StatsBar from "./StatsBar";
import Toolbar from "./Toolbar";
import LicenseTable from "./LicenseTable";
import { ConfirmModal, PromptModal } from "./Modals";

export default function Dashboard({ onLogout }) {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("monthly");
  const [days, setDays] = useState(30);
  const [phone, setPhone] = useState("");
  const [search, setSearch] = useState("");
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const [promptState, setPromptState] = useState(null);

  const add = useCallback((text, err = false) => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, text, err }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  }, []);

  const confirm = useCallback((msg, danger = false) => {
    return new Promise((resolve) => {
      setConfirmState({ msg, danger, resolve });
    });
  }, []);

  const prompt = useCallback((msg, def = "") => {
    return new Promise((resolve) => {
      setPromptState({ msg, def: String(def), resolve });
    });
  }, []);

  const changeType = (t) => {
    setType(t);
    if (t === "monthly") setDays(30);
    else if (t === "weekly") setDays(7);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api("/api/licenses");
      if (d.success) setLicenses(d.data);
      else add(d.error, true);
    } catch (e) {
      add(e.message, true);
    } finally {
      setLoading(false);
    }
  }, [add]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const s = { total: licenses.length, active: 0, expired: 0, suspended: 0 };
    licenses.forEach((l) => {
      if (s.hasOwnProperty(l.status)) s[l.status]++;
    });
    return s;
  }, [licenses]);

  const generate = async () => {
    const body = { membership_type: type };
    if (type !== "lifetime") body.duration_days = +days;
    if (phone.trim()) body.phone = phone.trim();
    try {
      const d = await api("/api/generate-code", { method: "POST", body: JSON.stringify(body) });
      if (d.success) add(`Generated: ${d.license_code}`);
      else add(d.error, true);
      load();
    } catch (e) {
      add(e.message, true);
    }
  };

  const genTrial = async () => {
    try {
      const d = await api("/api/generate-trial", { method: "POST", body: "{}" });
      if (d.success) add(`Trial: ${d.license_code}`);
      else add(d.error, true);
      load();
    } catch (e) {
      add(e.message, true);
    }
  };

  const act = async (code, endpoint, successMsg) => {
    if (endpoint === "delete-license") {
      const ok = await confirm(`Delete license ${code}? This cannot be undone.`, true);
      if (!ok) return;
    }
    if (endpoint === "suspend-license") {
      const ok = await confirm(`Toggle suspend for license ${code}?`, false);
      if (!ok) return;
    }
    let body = { license_code: code };
    if (endpoint === "extend-license") {
      const d = await prompt(`Extend license ${code}`, "30");
      if (!d) return;
      body.duration_days = +d;
    }
    try {
      const ep = endpoint === "delete-license" ? "licenses" : endpoint;
      const method = endpoint === "delete-license" ? "DELETE" : "POST";
      const d = await api(`/api/${ep}`, { method, body: JSON.stringify(body) });
      if (d.success) add(`${successMsg}: ${code}`);
      else add(d.error, true);
      load();
    } catch (e) {
      add(e.message, true);
    }
  };

  const handleLogout = () => {
    clearApiKey();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Toast toasts={toasts} />
      <ConfirmModal state={confirmState} close={() => setConfirmState(null)} />
      <PromptModal state={promptState} close={() => setPromptState(null)} />

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 shadow-sm">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">License Dashboard</h1>
              <p className="text-xs text-slate-400">{licenses.length} total licenses</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-6">
        <StatsBar stats={stats} />

        <Toolbar
          type={type}
          onChangeType={changeType}
          days={days}
          phone={phone}
          setPhone={setPhone}
          search={search}
          setSearch={setSearch}
          onGenerate={generate}
          onTrial={genTrial}
          loading={loading}
        />

        {loading ? (
          <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-16 shadow-sm">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500" />
          </div>
        ) : (
          <LicenseTable
            licenses={licenses}
            search={search}
            add={add}
            onAct={act}
          />
        )}
      </main>
    </div>
  );
}
