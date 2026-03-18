import { useState, useEffect } from "react";
import { getAlerts, deleteAlert } from "../api/alerts";

const B = "0.5px solid var(--color-border-tertiary)";

function timeAgo(isoStr) {
  const diff = (Date.now() - new Date(isoStr)) / 1000;
  if (diff < 60)    return "방금";
  if (diff < 3600)  return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAlerts(null, 100)
      .then(setAlerts)
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    await deleteAlert(id).catch(() => {});
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div style={{ paddingBottom: 72 }}>

      {/* 헤더 */}
      <header style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "var(--color-background-primary)", borderBottom: B,
        height: 54, padding: "0 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "-0.5px" }}>알림 로그</span>
        {alerts.length > 0 && (
          <button
            onClick={async () => {
              await Promise.all(alerts.map((a) => deleteAlert(a.id).catch(() => {})));
              setAlerts([]);
            }}
            style={{ border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "var(--color-text-danger)", fontWeight: 500 }}
          >
            전체 삭제
          </button>
        )}
      </header>

      {loading ? (
        <p style={{ padding: "60px 20px", textAlign: "center", fontSize: 14, color: "var(--color-text-tertiary)" }}>불러오는 중...</p>
      ) : alerts.length === 0 ? (
        <div style={{ padding: "80px 20px", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 32 }}>🔔</p>
          <p style={{ margin: "12px 0 0", fontSize: 15, fontWeight: 600, color: "var(--color-text-primary)" }}>알림 없음</p>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--color-text-tertiary)" }}>선에 근접하면 여기에 알림이 기록됩니다.</p>
        </div>
      ) : (
        <div style={{ margin: "16px 20px 0", background: "var(--color-background-primary)", borderRadius: 12, border: B, overflow: "hidden" }}>
          {alerts.map((alert, i) => {
            const isAttack = alert.signal_type === "attack";
            const isDomestic = /^\d{6}$/.test(alert.stock_code);
            const fmt = (p) => isDomestic ? p.toLocaleString() + "원" : "$" + p.toLocaleString();
            return (
              <div key={alert.id} style={{
                padding: "14px 16px", borderBottom: i < alerts.length - 1 ? B : "none",
                display: "flex", alignItems: "flex-start", gap: 12,
              }}>
                {/* 아이콘 */}
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: isAttack ? "var(--color-background-success)" : "var(--color-background-danger)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                }}>
                  {isAttack ? "📈" : "📉"}
                </div>

                {/* 내용 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-primary)" }}>{alert.stock_code}</span>
                    <span style={{
                      fontSize: 10, padding: "2px 7px", borderRadius: 20, fontWeight: 600,
                      background: isAttack ? "var(--color-background-success)" : "var(--color-background-danger)",
                      color: isAttack ? "var(--color-text-success)" : "var(--color-text-danger)",
                    }}>
                      {isAttack ? "공격 지점" : "로스 지점"}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>
                    현재가 <b style={{ color: "var(--color-text-primary)" }}>{fmt(alert.current_price)}</b>
                    {" "}/ 목표 <b>{fmt(alert.target_price)}</b>
                    {" "}/ 거리 <b style={{ color: isAttack ? "var(--color-text-success)" : "var(--color-text-danger)" }}>
                      {alert.distance_pct.toFixed(2)}%
                    </b>
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--color-text-tertiary)" }}>
                    {timeAgo(alert.created_at)}
                  </p>
                </div>

                {/* 삭제 */}
                <button
                  onClick={() => handleDelete(alert.id)}
                  style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18, color: "var(--color-text-tertiary)", padding: "0 2px", flexShrink: 0 }}
                >×</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
