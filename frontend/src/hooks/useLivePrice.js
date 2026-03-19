import { useState, useEffect, useRef } from "react";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000";
const WS_BASE = `${WS_URL}/ws/prices`;

/**
 * 실시간 가격 훅
 * @param {string[]} codes - 종목 코드 배열
 * @returns {Object} prices - { [code]: { price, change_pct } }
 */
export function useLivePrices(codes) {
  const [prices, setPrices] = useState({});
  const wsRef = useRef(null);

  useEffect(() => {
    if (!codes || codes.length === 0) return;

    const url = `${WS_BASE}?codes=${codes.join(",")}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.code && data.price != null) {
          setPrices((prev) => ({
            ...prev,
            [data.code]: { price: data.price, change_pct: data.change_pct },
          }));
        }
      } catch {}
    };

    ws.onerror = () => {};

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [codes.join(",")]); // eslint-disable-line

  return prices;
}

/**
 * 단일 종목 실시간 가격 훅
 * @param {string} code - 종목 코드
 * @returns {{ price: number|null, change_pct: string|null }}
 */
export function useLivePrice(code) {
  const prices = useLivePrices(code ? [code] : []);
  return prices[code] ?? { price: null, change_pct: null };
}
