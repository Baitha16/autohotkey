import { useState } from "react";
import { getApiKey } from "./lib/api";
import { ThemeProvider } from "./lib/theme";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [authed, setAuthed] = useState(!!getApiKey());

  return (
    <ThemeProvider>
      {!authed ? (
        <Login onLogin={() => setAuthed(true)} />
      ) : (
        <Dashboard onLogout={() => setAuthed(false)} />
      )}
    </ThemeProvider>
  );
}
