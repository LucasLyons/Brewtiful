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



export const metadata: Metadata = {
  metadataBase: new URL("https://brewtifulapp.com"),
  title: {
    default: "Brewtiful | Beer Recs on Tap!",
    template: "%s | Brewtiful"
  },
  description: "Brewtiful is an ML-powered beer recommendation app, serving up styles you'll be sure to love.",
  keywords: ["beer recommendations", "craft beer", "beer discovery", "ML beer recommendations", "beer app"],
  authors: [{ name: "Lucas Lyons", url: "https://lucaslyons.github.io/" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://brewtifulapp.com",
    siteName: "Brewtiful",
    title: "Brewtiful | Beer Recs on Tap!",
    description: "Brewtiful is an ML-powered beer recommendation app, serving up styles you'll be sure to love.",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 600,
        alt: "Brewtiful - Beer Recommendations"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Brewtiful | Beer Recs on Tap!",
    description: "Brewtiful is an ML-powered beer recommendation app, serving up styles you'll be sure to love.",
    images: ["/twitter-image.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true
    }
  }
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
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Brewtiful',
    description: 'ML-powered beer recommendation app serving up styles you\'ll be sure to love.',
    url: 'https://brewtifulapp.com',
    author: {
      '@type': 'Person',
      name: 'Lucas Lyons',
      url: 'https://lucaslyons.github.io/'
    }
  };

  return (

    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
                <p className="order-3">
                  Made with &lt;3 by{" "}
                  <a
                    href="https://lucaslyons.github.io/"
                    target="_blank"
                    className="hover:underline"
                    rel="noreferrer"
                  >
                    Lucas Lyons
                  </a>
                </p>
              </footer>
            </div>
            <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
