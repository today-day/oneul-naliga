import { useEffect, useState } from "react";

export default function SplashScreen({ onComplete }) {
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setHiding(true), 1600);
    const t2 = setTimeout(() => onComplete(), 2100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onComplete]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "linear-gradient(145deg, #eef8f2 0%, #f0edf8 50%, #fdf0ee 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      opacity: hiding ? 0 : 1,
      transition: "opacity 0.5s ease",
      pointerEvents: hiding ? "none" : "all",
    }}>
      <div style={{ animation: "splashIn 0.5s ease forwards", textAlign: "center" }}>
        <img
          src="/logo.png"
          alt="오늘 날이가"
          style={{
            width: 96, height: 96,
            borderRadius: 24,
            boxShadow: "0 12px 40px rgba(100, 100, 180, 0.2)",
            marginBottom: 20,
            display: "block", margin: "0 auto 20px",
          }}
        />
        <h1 style={{
          margin: 0, fontSize: 32, fontWeight: 700,
          fontFamily: "'Jua', sans-serif",
          color: "#1e1e38",
        }}>
          오늘 날이가
        </h1>
        <p style={{
          margin: "8px 0 0", fontSize: 13,
          color: "#9898b8",
          letterSpacing: "0.3px",
        }}>
          주식 선 알림 서비스
        </p>
      </div>
    </div>
  );
}
