"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * The app ships light-only (no theme toggle). We force the light theme so the
 * system preference never flips it to dark. The dark tokens still live in
 * globals.css (dormant), so dark mode can be re-enabled later by switching
 * `forcedTheme` back to `defaultTheme="system" enableSystem`.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" forcedTheme="light">
      {children}
    </NextThemesProvider>
  );
}
