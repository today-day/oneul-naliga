import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import ChartDetail from "./pages/ChartDetail";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";
import SplashScreen from "./components/SplashScreen";

const B = "0.5px solid var(--color-border-tertiary)";

function useBreakpoint() {
  const get = () => window.innerWidth < 768 ? "mobile" : window.innerWidth < 1100 ? "tablet" : "pc";
  const [bp, setBp] = useState(get);
  useEffect(() => {
    const h = () => setBp(get());
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return bp;
}

// 하위 호환용
function useIsMobile() { return useBreakpoint() === "mobile"; }

function Icon({ d, d2, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
      {d2 && <path d={d2} />}
    </svg>
  );
}

const NAV = [
  {
    id: "home", label: "홈", path: "/",
    icon: <Icon d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" d2="M9 22V12h6v10" />,
  },
  {
    id: "alert", label: "알림", path: "/alerts",
    icon: <Icon d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />,
  },
  {
    id: "settings", label: "설정", path: "/settings",
    icon: <Icon
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      d2="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />,
  },
];

// ── 모바일: 하단 탭바 ──────────────────────────────────────────────

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  // 차트 상세는 자체 헤더/백버튼 사용
  if (location.pathname.startsWith("/chart/")) return null;

  return (
    <nav className="glass" style={{
      position: "fixed", bottom: 0,
      left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 480,
      borderTop: B,
      boxShadow: "var(--shadow-nav)",
      display: "flex",
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
      zIndex: 100,
    }}>
      {NAV.map((item) => {
        const active = location.pathname === item.path;
        return (
          <button key={item.id} onClick={() => navigate(item.path)} style={{
            flex: 1, border: "none", background: "none",
            padding: "11px 0 8px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            cursor: "pointer",
            color: active ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
            transition: "color 0.15s",
          }}>
            {item.icon}
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, letterSpacing: active ? "-0.2px" : 0 }}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ── PC: 상단 네비바 ────────────────────────────────────────────────

function TopNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="glass" style={{
      position: "sticky", top: 0, zIndex: 50,
      borderBottom: B,
      boxShadow: "0 1px 20px rgba(80, 60, 160, 0.06)",
      height: 58,
      padding: "0 40px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      {/* 로고 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => navigate("/")}>
        <img src="/logo.png" alt="logo" style={{ width: 30, height: 30, borderRadius: 8, boxShadow: "0 2px 8px rgba(80,60,160,0.2)" }} />
        <span style={{ fontSize: 19, fontFamily: "'Jua', sans-serif", fontWeight: 700, color: "var(--color-text-primary)" }}>오늘 날이가</span>
      </div>

      {/* 네비 링크 */}
      <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {NAV.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button key={item.id} onClick={() => navigate(item.path)} style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "7px 16px", borderRadius: 10,
              border: "none",
              background: active ? "linear-gradient(135deg, rgba(106,143,255,0.12) 0%, rgba(160,106,249,0.12) 100%)" : "transparent",
              color: active ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
              fontSize: 14, fontWeight: active ? 700 : 400,
              cursor: "pointer", transition: "all 0.15s",
            }}>
              <Icon d={item.icon.props.d} d2={item.icon.props.d2} size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}

// ── 레이아웃 ───────────────────────────────────────────────────────

function AppLayout() {
  const bp = useBreakpoint();
  const isMobile = bp === "mobile";

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* 태블릿/PC: 상단 네비 */}
      {!isMobile && <TopNav />}

      {/* 콘텐츠 영역 */}
      <div style={{ maxWidth: isMobile ? 480 : "100%", margin: "0 auto" }}>
        <Routes>
          <Route path="/"            element={<Home />} />
          <Route path="/chart/:code" element={<ChartDetail />} />
          <Route path="/alerts"      element={<Alerts />} />
          <Route path="/settings"    element={<Settings />} />
        </Routes>
      </div>

      {/* 모바일 전용: 하단 탭바 */}
      {isMobile && <BottomNav />}
    </div>
  );
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <>
      {!splashDone && <SplashScreen onComplete={() => setSplashDone(true)} />}
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </>
  );
}
