import { useState, useEffect, useRef } from "react";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000";
const WS_BASE = `${WS_URL}/ws/orderbook`;

/**
 * 실시간 호가 훅
 * @param {string} code - 종목 코드 (국내 6자리만 지원)
 * @returns {{ asks, bids, total_ask_qty, total_bid_qty, supportResistance }}
 */
export function useOrderbook(code) {
  const [orderbook, setOrderbook] = useState({
    asks: [],
    bids: [],
    total_ask_qty: 0,
    total_bid_qty: 0,
  });
  const [supportResistance, setSupportResistance] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!code || !/^\d{6}$/.test(code)) return;

    const url = `${WS_BASE}?codes=${code}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.code !== code) return;

        const ob = {
          asks: data.asks || [],
          bids: data.bids || [],
          total_ask_qty: data.total_ask_qty || 0,
          total_bid_qty: data.total_bid_qty || 0,
        };
        setOrderbook(ob);

        // 잔량 분석: 평균의 3배 이상인 가격대 탐지
        const allEntries = [...ob.asks, ...ob.bids];
        if (allEntries.length > 0) {
          const avgQty = allEntries.reduce((s, e) => s + e.quantity, 0) / allEntries.length;
          const threshold = avgQty * 3;

          const levels = allEntries
            .filter((e) => e.quantity >= threshold && e.price > 0)
            .map((e) => ({
              price: e.price,
              quantity: e.quantity,
              type: ob.asks.some((a) => a.price === e.price) ? "resistance" : "support",
              ratio: (e.quantity / avgQty).toFixed(1),
            }));

          setSupportResistance(levels);
        } else {
          setSupportResistance([]);
        }
      } catch {}
    };

    ws.onerror = () => {};

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [code]);

  return { ...orderbook, supportResistance };
}
