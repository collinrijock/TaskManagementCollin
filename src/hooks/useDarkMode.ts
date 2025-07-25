import { useEffect, useState } from "react";

export default function useDarkMode() {
  const isClient = typeof window !== "undefined";

  const getInitialDarkMode = (): boolean => {
    if (!isClient) {
      return false;
    }

    const storedValue = localStorage.getItem("darkMode");
    if (storedValue !== null) {
      try {
        return JSON.parse(storedValue);
      } catch {
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
      }
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  };

  const [darkMode, setDarkMode] = useState<boolean>(getInitialDarkMode);

  useEffect(() => {
    if (!isClient) return;

    const darkModeMediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );
    const handleDarkModeChange = (event: MediaQueryListEvent) => {
      if (localStorage.getItem("darkMode") === null) {
        setDarkMode(event.matches);
      }
    };

    darkModeMediaQuery.addEventListener("change", handleDarkModeChange);
    return () =>
      darkModeMediaQuery.removeEventListener("change", handleDarkModeChange);
  }, [isClient]);

  useEffect(() => {
    if (!isClient) return;
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode, isClient]);

  return { darkMode, setDarkMode };
}
