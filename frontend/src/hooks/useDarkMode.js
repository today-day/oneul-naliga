import { useState, useEffect } from "react";

const EVT = "theme-change";

export function useDarkMode() {
  const [dark, setDark] = useState(
    () => document.documentElement.getAttribute("data-theme") === "dark"
  );

  useEffect(() => {
    const sync = () =>
      setDark(document.documentElement.getAttribute("data-theme") === "dark");
    window.addEventListener(EVT, sync);
    return () => window.removeEventListener(EVT, sync);
  }, []);

  const toggle = () => {
    const next = document.documentElement.getAttribute("data-theme") !== "dark";
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("theme", next ? "dark" : "light");
    window.dispatchEvent(new Event(EVT));
  };

  return [dark, toggle];
}
