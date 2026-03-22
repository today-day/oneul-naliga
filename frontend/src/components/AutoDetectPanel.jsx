import { useState, useEffect, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";
const B = "var(--border-tertiary)";

const ORDER_TABS = [
  { label: "작은 파동", order: 3 },
  { label: "중간 파동", order: 5 },
  { label: "큰 파동만", order: 10 },
];

function toCandleType(timeframe = "일봉") {
  if (timeframe === "주봉") return "W";
  if (timeframe === "월봉" || timeframe === "년봉") return "D";
  if (timeframe.endsWith("분")) return timeframe.replace("분", "");
  return "D";
}

/** "3거래일 전" → YYYYMMDD */
function daysAgoToDate(formed_at) {
  const match = (formed_at[0] || "").match(/(\d+)/);
  const days = match ? parseInt(match[1]) : 0;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function SkeletonRow() {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "11px 16px", gap: 10, borderBottom: B }}>
      <div style={{ flex: 1, height: 13, borderRadius: 6, background: "var(--color-background-tertiary)" }} />
      <div style={{ width: 52, height: 13, borderRadius: 6, background: "var(--color-background-tertiary)" }} />
      <div style={{ width: 44, height: 13, borderRadius: 6, background: "var(--color-background-tertiary)" }} />
      <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--color-background-tertiary)", flexShrink: 0 }} />
    </div>
  );
}

function SRRow({ item, type, onToggleExpand, expanded, onSelect, selectIdx }) {
  const isResist = type === "resistance";
  const color    = isResist ? "var(--color-rise)" : "var(--color-fall)";
  const bgColor  = isResist ? "var(--color-background-rise)" : "var(--color-background-fall)";
  const isNear   = Math.abs(item.distance_pct) < 2;
  const barWidth = Math.min(Math.abs(item.distance_pct) * 7, 75);
  const selected = selectIdx !== undefined;

  return (
    <>
      <div
        onClick={onToggleExpand}
        className="row-hover"
        style={{
          display: "flex", alignItems: "center", padding: "10px 16px", gap: 10,
          borderBottom: expanded ? "none" : B,
          cursor: "pointer", position: "relative", overflow: "hidden",
          background: selected ? bgColor : "transparent",
          transition: "background 0.12s",
        }}
      >
        {/* 거리 비례 배경 바 */}
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0,
          width: `${barWidth}%`, opacity: 0.05,
          background: color, pointerEvents: "none",
        }} />

        {/* 가격 */}
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", fontVariantNumeric: "tabular-nums" }}>
          {item.price.toLocaleString()}원
        </span>

        {/* 강도 레이블 */}
        <span style={{ fontSize: 11, color, whiteSpace: "nowrap" }}>
          {item.strength} {isResist ? "저항" : "지지"}
        </span>

        {/* 거리% + 근접 뱃지 */}
        <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 52, textAlign: "right", display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
          {item.distance_pct > 0 ? "+" : ""}{item.distance_pct}%
          {isNear && (
            <span style={{ fontSize: 9, padding: "1px 4px", borderRadius: 3, background: bgColor, color, fontWeight: 700 }}>
              근접
            </span>
          )}
        </span>

        {/* 선택 버튼 */}
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          style={{
            width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
            border: `2px solid ${selected ? color : "var(--color-border-primary)"}`,
            background: selected ? color : "transparent",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            padding: 0, transition: "all 0.15s",
          }}
        >
          {selected && <span style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>{selectIdx + 1}</span>}
        </button>
      </div>

      {/* 아코디언 */}
      {expanded && (
        <div style={{ padding: "10px 16px 12px", background: "var(--color-background-secondary)", borderBottom: B, fontSize: 12 }}>
          {[
            ["가격",       `${item.price.toLocaleString()}원`],
            ["현재가 대비", `${item.distance_pct > 0 ? "+" : ""}${item.distance_pct}%`],
            ["터치 횟수",  `${item.touch_count}회`],
            ["형성 근거",  item.formed_at.join(" / ")],
          ].map(([label, val]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--color-border-tertiary)" }}>
              <span style={{ color: "var(--color-text-tertiary)" }}>{label}</span>
              <span style={{ color: "var(--color-text-primary)", fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{val}</span>
            </div>
          ))}
          <p style={{ margin: "8px 0 0", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
            {isResist
              ? `이 가격대에서 ${item.touch_count}번 고점이 형성됐어요. 접근 시 매도 압력이 나올 수 있어요.`
              : `이 가격대에서 ${item.touch_count}번 저점이 형성됐어요.${isNear ? " 현재가와 매우 근접해 주의가 필요해요." : " 접근 시 반등을 기대할 수 있어요."}`
            }
          </p>
        </div>
      )}
    </>
  );
}

export default function AutoDetectPanel({ market, code, timeframe, onPointsSelected }) {
  const [order, setOrder]       = useState(5);
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [selected, setSelected] = useState([]);

  const candleType = toCandleType(timeframe);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelected([]);
    setExpanded(null);
    try {
      const resp = await fetch(
        `${API_URL}/api/stocks/${code}/support-resistance?candle_type=${candleType}&order=${order}`
      );
      if (!resp.ok) throw new Error();
      setData(await resp.json());
    } catch {
      setError("데이터를 불러올 수 없습니다");
    } finally {
      setLoading(false);
    }
  }, [code, candleType, order]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 해외 종목
  if (market === "US") {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "var(--color-text-secondary)", fontWeight: 600, marginBottom: 6 }}>
          국내 종목만 지원합니다
        </div>
        <div style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>
          해외 종목 지지/저항 분석은 준비 중입니다
        </div>
      </div>
    );
  }

  const toggleExpand = (key) => setExpanded(prev => prev === key ? null : key);

  const toggleSelect = (type, item) => {
    setSelected(prev => {
      const key = `${type}-${item.price}`;
      const idx = prev.findIndex(s => `${s.type}-${s.item.price}` === key);
      if (idx >= 0) return prev.filter((_, i) => i !== idx);
      if (prev.length >= 2) return [prev[1], { type, item }];
      return [...prev, { type, item }];
    });
  };

  const getSelectIdx = (type, item) => {
    const idx = selected.findIndex(s => `${s.type}-${s.item.price}` === `${type}-${item.price}`);
    return idx >= 0 ? idx : undefined;
  };

  const handleDraw = () => {
    if (selected.length === 2) {
      onPointsSelected(selected.map(s => ({
        date: daysAgoToDate(s.item.formed_at),
        price: s.item.price,
      })));
      setSelected([]);
    }
  };

  return (
    <div style={{ paddingBottom: 12 }}>
      {/* 파동 크기 */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 16px", borderBottom: B }}>
        <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginRight: 2 }}>파동 크기</span>
        {ORDER_TABS.map(({ label, order: o }) => (
          <button
            key={o}
            onClick={() => setOrder(o)}
            style={{
              padding: "5px 12px", borderRadius: 8, fontSize: 12,
              fontWeight: order === o ? 700 : 500,
              border: "none",
              background: order === o ? "var(--btn-active-bg)" : "var(--color-background-secondary)",
              color: order === o ? "var(--btn-active-text)" : "var(--color-text-secondary)",
              cursor: "pointer", flexShrink: 0,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 선택 상태 */}
      {selected.length > 0 && (
        <div style={{ margin: "10px 16px", padding: "10px 14px", background: "var(--color-background-info)", borderRadius: 10 }}>
          <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--color-text-info)", fontWeight: 600 }}>
            {selected.length === 1 ? "① 선택됨 — 두 번째 레벨을 선택하세요" : "② 두 레벨 선택 완료"}
          </p>
          {selected.map((s, i) => (
            <p key={i} style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)" }}>
              {i + 1}. {s.item.price.toLocaleString()}원 ({s.type === "resistance" ? "저항" : "지지"})
            </p>
          ))}
        </div>
      )}

      {/* 로딩 스켈레톤 */}
      {loading && (
        <>
          {[0, 1, 2].map(i => <SkeletonRow key={`r${i}`} />)}
          <div style={{ padding: "9px 16px", borderTop: `1px dashed var(--color-border-primary)`, borderBottom: `1px dashed var(--color-border-primary)` }}>
            <div style={{ height: 1 }} />
          </div>
          {[0, 1, 2].map(i => <SkeletonRow key={`s${i}`} />)}
        </>
      )}

      {/* 오류 */}
      {!loading && error && (
        <div style={{ padding: "32px 20px", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 12 }}>{error}</p>
          <button
            onClick={fetchData}
            style={{ fontSize: 12, padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", background: "var(--color-background-secondary)", color: "var(--color-text-primary)" }}
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 데이터 */}
      {!loading && data && (
        <>
          {/* 저항 (현재가에서 먼 것부터 위에) */}
          {data.resistances.length === 0
            ? <p style={{ padding: "12px 16px", fontSize: 12, color: "var(--color-text-tertiary)" }}>탐지된 저항 구간 없음</p>
            : [...data.resistances].reverse().map((item, i) => {
                const key = `r${i}`;
                return (
                  <SRRow key={key} item={item} type="resistance"
                    expanded={expanded === key} onToggleExpand={() => toggleExpand(key)}
                    onSelect={() => toggleSelect("resistance", item)}
                    selectIdx={getSelectIdx("resistance", item)}
                  />
                );
              })
          }

          {/* 현재가 구분선 */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", borderTop: "1px dashed var(--color-border-primary)", borderBottom: "1px dashed var(--color-border-primary)" }}>
            <div style={{ flex: 1, height: 1, background: "orange", opacity: 0.5 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "orange", whiteSpace: "nowrap" }}>
              현재 {data.current_price.toLocaleString()}원
            </span>
            <div style={{ flex: 1, height: 1, background: "orange", opacity: 0.5 }} />
          </div>

          {/* 지지 (현재가에서 가까운 것부터 아래에) */}
          {data.supports.length === 0
            ? <p style={{ padding: "12px 16px", fontSize: 12, color: "var(--color-text-tertiary)" }}>탐지된 지지 구간 없음</p>
            : data.supports.map((item, i) => {
                const key = `s${i}`;
                return (
                  <SRRow key={key} item={item} type="support"
                    expanded={expanded === key} onToggleExpand={() => toggleExpand(key)}
                    onSelect={() => toggleSelect("support", item)}
                    selectIdx={getSelectIdx("support", item)}
                  />
                );
              })
          }

          {/* 가이드 */}
          <div style={{ margin: "10px 16px 0", padding: "10px 12px", borderRadius: 8, background: "var(--color-background-secondary)", fontSize: 11, color: "var(--color-text-tertiary)", lineHeight: 1.75 }}>
            <span style={{ color: "var(--color-rise)", fontWeight: 600 }}>저항선</span>은
            현재가 위 — 가격이 막히기 쉬운 구간으로, 돌파 시 추가 상승으로 이어질 수 있어요.<br />
            <span style={{ color: "var(--color-fall)", fontWeight: 600 }}>지지선</span>은
            현재가 아래 — 반등을 기대할 수 있는 구간으로, 이탈 시 추가 하락에 유의하세요.<br />
            <span style={{ color: "orange" }}>오른쪽 버튼을 눌러 2개 선택 후 추세선을 그릴 수 있어요.</span>
          </div>
        </>
      )}

      {/* 추세선 그리기 버튼 */}
      {selected.length === 2 && (
        <div style={{ padding: "12px 16px 0" }}>
          <button
            onClick={handleDraw}
            style={{
              width: "100%", padding: "13px 0", fontSize: 14, fontWeight: 700,
              background: "var(--btn-active-bg)", color: "var(--btn-active-text)",
              border: "none", borderRadius: 12, cursor: "pointer",
            }}
          >
            선택한 두 레벨로 추세선 그리기
          </button>
        </div>
      )}
    </div>
  );
}
