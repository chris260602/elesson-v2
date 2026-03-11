"use client"

import { useSession } from "next-auth/react";
import { ThemeProvider as NextThemesProvider, ThemeProviderProps, useTheme } from "next-themes"
import { useEffect } from "react";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
   // * User Data
   const session = useSession();
   const userData = session.data?.user?.user;

  const { setTheme,theme } = useTheme();

  useEffect(()=>{
    if(userData?.theme_preference === "dark" && theme !== "dark"){
      setTheme("dark")
    }
    if(userData?.theme_preference === "light" && theme !== "light"){
      setTheme("light")
    }
    if(userData?.theme_preference === "system" && theme !== "system"){
      setTheme("system")
    }
  },[userData]);
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}