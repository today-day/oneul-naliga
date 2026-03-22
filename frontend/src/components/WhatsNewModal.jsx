const WHATS_NEW_KEY = "whats_new_dismissed_v1";

export default function WhatsNewModal({ onClose }) {
  const dismiss = () => {
    localStorage.setItem(WHATS_NEW_KEY, "1");
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10000,
      background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      padding: "0 0 24px",
    }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "var(--color-background-primary)",
          borderRadius: "20px 20px 16px 16px",
          padding: "28px 24px 20px",
          animation: "slideUp 0.3s ease forwards",
        }}
      >
        {/* 헤더 */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--color-text-primary)" }}>새 기능이 추가됐어요</p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--color-text-tertiary)" }}>주식 상세 페이지에서 확인하세요</p>
        </div>

        {/* 항목 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
          <div style={{ padding: "14px 16px", borderRadius: 12, background: "var(--color-background-secondary)" }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)" }}>분석 탭</p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
              RSI, MACD, 볼린저밴드 등 10가지 기술적 지표를 한눈에 확인하고 매수/매도 신호를 참고할 수 있어요.
            </p>
          </div>

          <div style={{ padding: "14px 16px", borderRadius: 12, background: "var(--color-background-secondary)" }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)" }}>지지/저항 탭</p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
              과거 고점·저점을 분석해 주요 지지선과 저항선을 자동으로 감지해드려요. 두 레벨을 선택해 추세선도 그릴 수 있어요.
            </p>
          </div>
        </div>

        {/* 버튼 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              width: "100%", padding: "13px 0", fontSize: 14, fontWeight: 700,
              background: "var(--color-text-primary)", color: "var(--color-background-primary)",
              border: "none", borderRadius: 12, cursor: "pointer",
            }}
          >
            확인했어요
          </button>
          <button
            onClick={dismiss}
            style={{
              width: "100%", padding: "10px 0", fontSize: 13,
              background: "none", color: "var(--color-text-tertiary)",
              border: "none", cursor: "pointer",
            }}
          >
            다시 보지 않기
          </button>
        </div>
      </div>
    </div>
  );
}

export function shouldShowWhatsNew() {
  return localStorage.getItem(WHATS_NEW_KEY) !== "1";
}
