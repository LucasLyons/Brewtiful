import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/next"
import { AuthButton } from "@/components/auth/auth-button";
import { ThemeSwitcher } from "@/components/shared/theme-switcher";
import BrewtifulLogo from "@/components/layout/brewtiful-logo"
import { NavigationTabs } from "@/components/layout/navigation-tabs";
import { AccountRestoredMessage } from "@/components/auth/account-restored-message";
import "./globals.css";

export const dynamic = 'force-dynamic'

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Brewtiful | Beer Recs on Tap!",
  description: "Brewtiful is an ML-powered beer recommendation app, serving up styles you'll be sure to love.",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (

    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
            <div className="min-h-screen w-full flex flex-col items-center">
              <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
                <div className="w-full max-w-7xl flex justify-between items-center p-2 sm:p-3 px-3 sm:px-5 text-sm">
                  <div className="flex gap-2 sm:gap-6 items-center">
                    <div className="font-semibold">
                      {<BrewtifulLogo />}
                    </div>
                    <NavigationTabs />
                  </div>
                  <div className="flex gap-2 sm:gap-4 items-center">
                    {<AuthButton />}
                    <ThemeSwitcher/>
                  </div>
                </div>
              </nav>
              <main className="flex-1 w-full flex flex-col items-center">
                <AccountRestoredMessage />
                {children}
              </main>
              <footer className="w-full flex flex-col sm:flex-row items-center justify-center border-t mx-auto text-center text-xs gap-2 sm:gap-8 py-4 px-4">
                <p className="order-2 sm:order-1">
                  Powered by{" "}
                  <a
                    href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
                    target="_blank"
                    className="font-bold hover:underline"
                    rel="noreferrer"
                  >
                    Supabase
                  </a>
                </p>
                <div className="flex gap-4 order-1 sm:order-2">
                  <a
                    href="/about"
                    className="hover:underline"
                  >
                    About
                  </a>
                  <a
                    href="/privacy"
                    className="hover:underline"
                  >
                    Privacy Policy
                  </a>
                </div>
              </footer>
            </div>
            <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
