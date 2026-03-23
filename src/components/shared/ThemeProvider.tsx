"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
// Avoid importing from /dist/types; use the library's top-level types if available
// or simply use the React.ComponentProps helper for strict typing
import { type ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
