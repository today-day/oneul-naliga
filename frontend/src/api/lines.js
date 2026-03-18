const BASE = "/api";

export const getLines = (stockCode) =>
  fetch(`${BASE}/lines/${stockCode}`).then((r) => r.json());

export const createLine = (body) =>
  fetch(`${BASE}/lines/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json());

export const updateLine = (id, body) =>
  fetch(`${BASE}/lines/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json());

export const deleteLine = (id) =>
  fetch(`${BASE}/lines/${id}`, { method: "DELETE" }).then((r) => r.json());
