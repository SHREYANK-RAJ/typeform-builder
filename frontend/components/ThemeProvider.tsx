"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import {
  ThemeMode,
  AccentTheme,
  getStoredThemeMode,
  getStoredAccent,
  applyTheme,
  applyAccent,
} from "../lib/theme";

type ThemeContextType = {
  mode: ThemeMode;
  accent: AccentTheme;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentTheme) => void;
};

const ThemeContext =
  createContext<ThemeContextType | undefined>(
    undefined
  );

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [mode, setModeState] =
    useState<ThemeMode>("light");

  const [accent, setAccentState] =
    useState<AccentTheme>("minimal");

  useEffect(() => {
    const storedMode =
      getStoredThemeMode();

    const storedAccent =
      getStoredAccent();

    setModeState(storedMode);
    setAccentState(storedAccent);

    applyTheme(storedMode);
    applyAccent(storedAccent);
  }, []);

  function setMode(newMode: ThemeMode) {
    setModeState(newMode);
    applyTheme(newMode);
  }

  function setAccent(
    newAccent: AccentTheme
  ) {
    setAccentState(newAccent);
    applyAccent(newAccent);
  }

  return (
    <ThemeContext.Provider
      value={{
        mode,
        accent,
        setMode,
        setAccent,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context =
    useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme must be used inside ThemeProvider"
    );
  }

  return context;
}