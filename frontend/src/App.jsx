import { useState } from "react";
import { getApiKey } from "./lib/api";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [authed, setAuthed] = useState(!!getApiKey());

  if (!authed) {
    return <Login onLogin={() => setAuthed(true)} />;
  }

  return <Dashboard onLogout={() => setAuthed(false)} />;
}
