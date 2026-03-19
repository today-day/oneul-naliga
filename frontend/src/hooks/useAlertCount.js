import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "";

export function useAlertCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = (userId) => {
    const params = new URLSearchParams({ limit: 200 });
    if (userId) params.set("user_id", userId);
    fetch(`${API_URL}/api/alerts/?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        // 최근 24시간 알림 개수
        const since = Date.now() - 24 * 60 * 60 * 1000;
        const recent = data.filter((a) => new Date(a.created_at).getTime() > since);
        setCount(recent.length);
      })
      .catch(() => {});
  };

  useEffect(() => {
    refresh(user?.id);
    const interval = setInterval(() => refresh(user?.id), 60000); // 1분마다 갱신
    return () => clearInterval(interval);
  }, [user?.id]);

  return count;
}
