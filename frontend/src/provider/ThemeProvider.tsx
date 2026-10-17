"use client";

import React, { createContext, useContext, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(
  undefined,
);

export default function ThemeProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [theme, setThemeState] = React.useState<Theme>("dark");

  React.useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved) {
      setThemeState(saved);
    }
  }, []);

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const setTheme = React.useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
  }, []);

  const handleSetTheme = (theme: Theme) => {
    setTheme(theme);
    localStorage.setItem("theme", theme);
  };
  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
