const API_URL = import.meta.env.VITE_API_URL || "";
const BASE = `${API_URL}/api`;

export const getAlerts = (stockCode, limit = 50, userId) => {
  const params = new URLSearchParams({ limit });
  if (stockCode) params.set("stock_code", stockCode);
  if (userId) params.set("user_id", userId);
  return fetch(`${BASE}/alerts/?${params}`).then((r) => r.json());
};

export const deleteAlert = (id, userId) => {
  const params = userId ? `?user_id=${userId}` : "";
  return fetch(`${BASE}/alerts/${id}${params}`, { method: "DELETE" }).then((r) => r.json());
};
