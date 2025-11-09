'use client'

import Link from 'next/link'
import { Beer, Compass, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export function SplashPage({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const handleGoogleSignIn = async () => {
    const supabase = createClient();

    // Determine the correct redirect URL based on environment
    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });

    if (error) {
      console.error('Error signing in with Google:', error.message);
    }
  };
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-48 sm:w-72 h-48 sm:h-72 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-60 sm:w-96 h-60 sm:h-96 bg-orange-500/10 dark:bg-orange-500/5 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-yellow-500/5 dark:bg-yellow-500/3 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Main content */}
      <div className="text-center space-y-6 sm:space-y-8 max-w-4xl mx-auto relative">
        {/* Logo/Icon */}
        <div className="group inline-flex justify-center items-center gap-1 sm:gap-2 animate-fade-in cursor-pointer px-4 sm:px-8 py-4 sm:py-8">
          <Beer
            className="w-12 h-12 sm:w-16 sm:h-16 text-amber-600 dark:text-amber-500 transition-all duration-700 ease-out group-hover:[transform:translate(12px,-60px)_rotate(-20deg)]"
            style={{
              willChange: 'transform',
            }}
          />
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 dark:from-amber-500 dark:via-orange-500 dark:to-amber-500 bg-clip-text text-transparent">
            Brewtiful
          </h1>
        </div>

        {/* Tagline with sparkle effect */}
        <div className="flex items-center justify-center gap-2 animate-fade-in-delay-1 px-4">
          <Sparkles className="hidden sm:block w-5 h-5 text-amber-500 animate-slow-pulse shrink-0" />
          <p className="text-base sm:text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl">
            Your new favourite bartender, serving ML-powered beer recommendations!
          </p>
          <Sparkles className="hidden sm:block w-5 h-5 text-amber-500 animate-slow-pulse shrink-0" />
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 py-6 sm:py-8 animate-fade-in-delay-2">
          <div className="p-6 rounded-lg border bg-card hover:bg-accent/50 transition-colors duration-300 hover:scale-105 transform">
            <Compass className="w-10 h-10 text-amber-600 dark:text-amber-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Smart Discovery</h3>
            <p className="text-sm text-muted-foreground">
              Vector-based search to find beers you&apos;ll love.
            </p>
          </div>

          <div className="p-6 rounded-lg border bg-card hover:bg-accent/50 transition-colors duration-300 hover:scale-105 transform delay-100">
            <Beer className="w-10 h-10 text-amber-600 dark:text-amber-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Vast Collection</h3>
            <p className="text-sm text-muted-foreground">
              Explore thousands of beers and breweries worldwide.
            </p>
          </div>

          <div className="p-6 rounded-lg border bg-card hover:bg-accent/50 transition-colors duration-300 hover:scale-105 transform delay-200">
            <Sparkles className="w-10 h-10 text-amber-600 dark:text-amber-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Personalized</h3>
            <p className="text-sm text-muted-foreground">
              The more you rate, the better the recommendations get!
            </p>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center pt-4 animate-fade-in-delay-3 px-4">
          {isLoggedIn ? (
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg group w-full sm:w-auto"
            >
              <Link href="/recommendations" className="flex items-center justify-center">
                <span className="truncate">See Recommendations</span>
                <ArrowRight className="ml-2 w-5 h-5 shrink-0 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          ) : (
            <Button
              onClick={handleGoogleSignIn}
              size="lg"
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg group w-full sm:w-auto"
            >
              <svg className="w-5 h-5 shrink-0 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="truncate">Sign In for Recommendations</span>
              <ArrowRight className="ml-2 w-5 h-5 shrink-0 group-hover:translate-x-1 transition-transform" />
            </Button>
          )}

          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-amber-600 dark:border-amber-500 text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 font-semibold px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg group w-full sm:w-auto"
          >
            <Link href="/beers" className="flex items-center justify-center">
              <span>Browse Beers</span>
              <Beer className="ml-2 w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
            </Link>
          </Button>
        </div>

        {/* Secondary link */}
        <div className="pt-4 animate-fade-in-delay-4">
          <Link
            href="/breweries"
            className="text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline inline-flex items-center gap-1"
          >
            Or explore breweries
            <ArrowRight className="w-4 h-4 shrink-0" />
          </Link>
        </div>
      </div>
    </div>
  )
}
