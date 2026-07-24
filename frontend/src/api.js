const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json();
}

export const api = {
  getSummary: () => request("/dashboard/summary"),
  getDevices: () => request("/devices?limit=100"),
  getAlerts: () => request("/alerts?limit=100"),
  getEvents: () => request("/events?limit=8"),
};
