export type ThemeMode = "light" | "dark" | "system";

export type AccentTheme =
  | "minimal"
  | "ocean"
  | "lavender"
  | "sunset";

export const THEME_STORAGE_KEY = "typeform-theme-mode";
export const ACCENT_STORAGE_KEY = "typeform-accent-theme";

export function getStoredThemeMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = localStorage.getItem(
    THEME_STORAGE_KEY
  );

  if (
    stored === "light" ||
    stored === "dark" ||
    stored === "system"
  ) {
    return stored;
  }

  return "light";
}

export function getStoredAccent(): AccentTheme {
  if (typeof window === "undefined") {
    return "minimal";
  }

  const stored = localStorage.getItem(
    ACCENT_STORAGE_KEY
  );

  if (
    stored === "minimal" ||
    stored === "ocean" ||
    stored === "lavender" ||
    stored === "sunset"
  ) {
    return stored;
  }

  return "minimal";
}

export function applyTheme(mode: ThemeMode) {
  if (typeof window === "undefined") {
    return;
  }

  const root = document.documentElement;

  const isDark =
    mode === "dark" ||
    (mode === "system" &&
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches);

  root.classList.toggle("dark", isDark);

  root.dataset.theme = mode;

  localStorage.setItem(
    THEME_STORAGE_KEY,
    mode
  );
}

export function applyAccent(accent: AccentTheme) {
  if (typeof window === "undefined") {
    return;
  }

  const root = document.documentElement;

  root.dataset.accent = accent;

  localStorage.setItem(
    ACCENT_STORAGE_KEY,
    accent
  );
}