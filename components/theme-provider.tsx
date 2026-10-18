import * as React from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

/** Exported so the flash-prevention script inlined in index.html reads the same key. */
export const THEME_STORAGE_KEY = "mobitouch-theme";
const STORAGE_KEY = THEME_STORAGE_KEY;

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = React.createContext<ThemeContextValue>({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
});

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

function systemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Server render and first client render must agree, so start from the
  // default and reconcile in an effect — ThemeScript has already put the
  // correct class on <html>, so nothing visibly changes.
  const [theme, setThemeState] = React.useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>("light");

  React.useEffect(() => {
    // Genuinely can't be computed during render: localStorage doesn't exist
    // on the server, and reading it unconditionally on the client's first
    // render would desync from the server-rendered HTML and trigger a
    // hydration mismatch. Starting from "system"/"light" and correcting
    // here — after ThemeScript has already set the right class on <html>,
    // so nothing visibly flashes — is the standard fix for this exact case.
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system";
    /* eslint-disable react-hooks/set-state-in-effect --
       which of these two calls the rule flags as "the second, cascading
       one" isn't stable across edits, so the whole pair is disabled
       together rather than chasing it line by line. */
    setThemeState(stored);
    setResolvedTheme(stored === "system" ? systemTheme() : stored);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  React.useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next = systemTheme();
      setResolvedTheme(next);
      applyTheme(next);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = React.useCallback((next: Theme) => {
    localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
    const resolved = next === "system" ? systemTheme() : next;
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, []);

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return React.useContext(ThemeContext);
}
