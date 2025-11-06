import { useEffect, useState } from "react";

export function useSystemTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    // 检查localStorage中保存的主题
    const savedTheme = localStorage.getItem("pandaskiing-theme");

    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }

    // 检查系统主题偏好
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    // 监听系统主题变化
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const savedTheme = localStorage.getItem("pandaskiing-theme");

      if (!savedTheme || savedTheme === "system") {
        setTheme(e.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () =>
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, []);

  useEffect(() => {
    // 应用主题到HTML根元素
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");
    root.classList.add(theme);

    // 保存到localStorage
    localStorage.setItem("pandaskiing-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return { theme, setTheme, toggleTheme };
}
