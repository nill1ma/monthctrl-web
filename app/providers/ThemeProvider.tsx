'use client'

import { ThemeProvider as NextThemesProvider, useTheme as nextUseTheme } from 'next-themes'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="data-theme" defaultTheme="system" enableSystem scriptProps={{ suppressHydrationWarning: true }}>
      {children}
    </NextThemesProvider>
  )
}

export function useTheme(){
    const { theme, setTheme, resolvedTheme } = nextUseTheme()

    return { theme, setTheme, resolvedTheme }
}


