import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/next"
import { AuthButton } from "@/components/auth/auth-button";
import { ThemeSwitcher } from "@/components/shared/theme-switcher";
import BrewtifulLogo from "@/components/layout/brewtiful-logo"
import { NavigationTabs } from "@/components/layout/navigation-tabs";
import { ClientIdProvider } from "@/components/providers/client-id-provider";
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
          <ClientIdProvider>
            <div className="min-h-screen w-full flex flex-col items-center">
            <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
              <div className="w-full max-w-7xl flex justify-between items-center p-3 px-5 text-sm">
                <div className="flex gap-6 items-center">
                  <div className="font-semibold">
                    {<BrewtifulLogo />}
                  </div>
                  <NavigationTabs />
                </div>
                <div className="flex gap-4 items-center">
                  {<AuthButton />}
                  <ThemeSwitcher/>
                </div>
              </div>
            </nav>
            <main className="flex-1 w-full flex flex-col items-center">
              {children}
            </main>
            <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-4">
              <p>
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
            </footer>
          </div>
            <Analytics />
          </ClientIdProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
