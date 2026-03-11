"use client";

import { ThemeProvider } from "next-themes";

export default function CustomThemeProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {

  return <ThemeProvider attribute="class" defaultTheme="light">{children}</ThemeProvider>;
}
