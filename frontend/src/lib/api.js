const LS_KEY = "dashboard_api_key";

export function getApiKey() {
  return localStorage.getItem(LS_KEY);
}

export function setApiKey(key) {
  localStorage.setItem(LS_KEY, key);
}

export function clearApiKey() {
  localStorage.removeItem(LS_KEY);
}

export async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json" };
  const apiKey = getApiKey();
  if (apiKey) headers["x-api-key"] = apiKey;

  const res = await fetch(path, { ...options, headers: { ...headers, ...options.headers } });
  return res.json();
}

export async function verifyKey(key) {
  const res = await fetch("/api/licenses", {
    headers: { "Content-Type": "application/json", "x-api-key": key },
  });
  const d = await res.json();
  return d.success;
}
