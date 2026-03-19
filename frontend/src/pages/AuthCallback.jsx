import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        // PKCE 코드 교환 완료 → 홈으로
        navigate("/", { replace: true });
      } else if (event === "INITIAL_SESSION" && session) {
        // 이미 세션 있는 경우 → 홈으로
        navigate("/", { replace: true });
      }
      // INITIAL_SESSION with null → SIGNED_IN 올 때까지 대기
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="splash-bg" style={{
      position: "fixed", inset: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <p style={{ color: "var(--color-text-tertiary)", fontSize: 14 }}>로그인 처리 중...</p>
    </div>
  );
}
