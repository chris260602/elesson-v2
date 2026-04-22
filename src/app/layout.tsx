import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import CustomSessionProvider from "@/providers/CustomSessionProvider";
import CustomThemeProvider from "@/providers/CustomThemeProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { auth } from "@/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Elesson Math Mavens",
    template: "%s | Elesson Math Mavens",
  },
  description: "The official Math Mavens E-Lesson Portal. Access interactive math lessons, revision worksheets, and comprehensive educational resources.",
  applicationName: "Elesson Math Mavens",
  authors: [{ name: "Christoper Lim" }],
  creator: "Christoper Lim",
  publisher: "Christoper Lim",
  icons: {
    icon: "/math-mavens-logo.png",
    apple: "/math-mavens-logo.png",
  },
  openGraph: {
    title: "Elesson Math Mavens",
    description: "The official Math Mavens E-Lesson Portal. Access interactive math lessons and revision worksheets.",
    type: "website",
    siteName: "Elesson Math Mavens",
    locale: "en_US",
    images: [
      {
        url: "/math-mavens-logo.png",
        width: 800,
        height: 600,
        alt: "Math Mavens Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elesson Math Mavens",
    description: "Access interactive math lessons and revision worksheets at the Math Mavens Portal.",
    images: ["/math-mavens-logo.png"],
  },
  // robots: {
  //   index: true,
  //   follow: true,
  //   nocache: true,
  //   googleBot: {
  //     index: true,
  //     follow: true,
  //   },
  // },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider session={session}>
          <CustomSessionProvider>
            <CustomThemeProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem
                disableTransitionOnChange
              >
                {children}
              </ThemeProvider>
              <Toaster position="top-right" />
            </CustomThemeProvider>
          </CustomSessionProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

