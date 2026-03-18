import { useState } from "react";

const B = "0.5px solid var(--color-border-tertiary)";

function StatusBadge({ ok }) {
  return (
    <span style={{
      fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 600,
      background: ok ? "var(--color-background-success)" : "var(--color-background-danger)",
      color: ok ? "var(--color-text-success)" : "var(--color-text-danger)",
    }}>
      {ok ? "연결됨" : "미연결"}
    </span>
  );
}

function SettingRow({ label, sub, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: B }}>
      <div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>{label}</p>
        {sub && <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--color-text-tertiary)" }}>{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export default function Settings() {
  const [tgTesting, setTgTesting] = useState(false);
  const [tgResult,  setTgResult]  = useState(null);

  const testTelegram = async () => {
    setTgTesting(true);
    setTgResult(null);
    try {
      const res = await fetch("/api/alerts/test-telegram", { method: "POST" });
      const data = await res.json();
      setTgResult(data.ok ? "ok" : "fail");
    } catch {
      setTgResult("fail");
    } finally {
      setTgTesting(false);
    }
  };

  return (
    <div style={{ paddingBottom: 72 }}>

      {/* 헤더 */}
      <header style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "var(--color-background-primary)", borderBottom: B,
        height: 54, padding: "0 20px",
        display: "flex", alignItems: "center",
      }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "-0.5px" }}>설정</span>
      </header>

      <div style={{ padding: "20px 20px 0" }}>

        {/* API 연결 상태 */}
        <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>API 연결</p>
        <div style={{ background: "var(--color-background-primary)", borderRadius: 12, border: B, overflow: "hidden", marginBottom: 20 }}>
          <SettingRow
            label="키움 REST API"
            sub="국내 주식 차트 · 현재가"
            right={<StatusBadge ok={false} />}
          />
          <SettingRow
            label="한국투자증권 API"
            sub="해외 주식 차트 · 현재가"
            right={<StatusBadge ok={false} />}
          />
          <div style={{ padding: "14px 20px", borderBottom: B }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>텔레그램 봇</p>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--color-text-tertiary)" }}>가격 도달 알림 발송</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {tgResult === "ok"   && <StatusBadge ok={true} />}
                {tgResult === "fail" && <StatusBadge ok={false} />}
                <button
                  onClick={testTelegram}
                  disabled={tgTesting}
                  style={{
                    padding: "7px 14px", fontSize: 12, fontWeight: 600, borderRadius: 8,
                    border: B, background: "var(--color-background-secondary)",
                    color: "var(--color-text-primary)", cursor: "pointer",
                    opacity: tgTesting ? 0.5 : 1,
                  }}
                >
                  {tgTesting ? "전송 중..." : "테스트 전송"}
                </button>
              </div>
            </div>
          </div>
          <div style={{ padding: "12px 20px" }}>
            <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-tertiary)" }}>
              API 키는 서버의 <code style={{ background: "var(--color-background-secondary)", padding: "1px 6px", borderRadius: 4, fontSize: 11 }}>.env</code> 파일에서 설정합니다.
            </p>
          </div>
        </div>

        {/* 감시 설정 */}
        <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>감시 설정</p>
        <div style={{ background: "var(--color-background-primary)", borderRadius: 12, border: B, overflow: "hidden", marginBottom: 20 }}>
          <SettingRow
            label="실시간 감시"
            sub="분봉 선 — WebSocket"
            right={<StatusBadge ok={false} />}
          />
          <SettingRow
            label="일봉 감시"
            sub="일봉/주봉/월봉 — 장 마감 후 15:30"
            right={<span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>매일 1회</span>}
          />
        </div>

        {/* 앱 정보 */}
        <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>앱 정보</p>
        <div style={{ background: "var(--color-background-primary)", borderRadius: 12, border: B, overflow: "hidden", marginBottom: 20 }}>
          <SettingRow label="앱 이름" right={<span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>오늘 날이가</span>} />
          <SettingRow label="버전" right={<span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>0.1.0</span>} />
          <SettingRow
            label="기술 스택"
            right={<span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>React · FastAPI · Supabase</span>}
          />
        </div>

      </div>
    </div>
  );
}
