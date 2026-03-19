import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { loginWithKakao } = useAuth();
  const isMobile = window.innerWidth < 768;
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowButton(true), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="splash-bg" style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", flexDirection: "column",
      alignItems: "center",
    }}>
      <div style={{
        flex: 1,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        paddingBottom: isMobile ? "4vh" : 0,
        position: "relative",
        width: "100%",
      }}>
        {/* 타이틀 + 문구 → 버튼 등장 시 페이드아웃 */}
        <div style={{
          textAlign: "center",
          opacity: showButton ? 0 : 1,
          transition: "opacity 0.4s ease",
          position: "absolute",
        }}>
          <h1 style={{
            margin: 0, fontSize: 34, fontWeight: 800,
            color: "var(--color-text-primary)", letterSpacing: "-0.5px",
          }}>
            오늘 날이가
          </h1>
          <p style={{
            margin: "12px 0 0", fontSize: 18,
            color: "var(--color-text-tertiary)", fontWeight: 400,
          }}>
            오늘 하루도 건승하세요!
          </p>
        </div>

        {/* 카카오 버튼 → 스르륵 아래에서 등장 */}
        <div style={{
          marginTop: isMobile ? "28vh" : "12vh",
          opacity: showButton ? 1 : 0,
          transform: showButton ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
        }}>
          <button
            onClick={loginWithKakao}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "0 28px", height: 52, borderRadius: 12, border: "none",
              background: "#FEE500", color: "#191919",
              fontSize: 16, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              lineHeight: 1,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ flexShrink: 0 }}>
              <path d="M11 2C6.03 2 2 5.358 2 9.5c0 2.685 1.71 5.045 4.3 6.394l-.87 3.243a.25.25 0 00.383.272L9.99 17.1c.33.048.667.073 1.01.073 4.97 0 9-3.358 9-7.5S15.97 2 11 2z" fill="#191919"/>
            </svg>
            카카오로 시작하기
          </button>
        </div>
      </div>

      {/* 하단: splash_logo 이미지 (모바일만) */}
      {isMobile && (
        <div style={{
          height: "52vh", width: "100%",
          flexShrink: 0, overflow: "hidden",
        }}>
          <img
            src="/splash_logo.png"
            alt=""
            style={{
              width: "100%", height: "100%",
              objectFit: "cover", objectPosition: "center top",
              display: "block",
              maskImage: "linear-gradient(to bottom, transparent 0%, black 30%)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 30%)",
            }}
          />
        </div>
      )}
    </div>
  );
}
