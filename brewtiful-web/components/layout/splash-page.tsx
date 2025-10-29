'use client'

import Link from 'next/link'
import { Beer, Compass, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SplashPage({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 dark:bg-orange-500/5 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/5 dark:bg-yellow-500/3 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Main content */}
      <div className="text-center space-y-8 max-w-4xl mx-auto relative">
        {/* Logo/Icon */}
        <div className="group inline-flex justify-center items-center gap-1 animate-fade-in cursor-pointer px-8 py-8">
          <Beer
            className="w-16 h-16 text-amber-600 dark:text-amber-500 transition-all duration-700 ease-out group-hover:[transform:translate(12px,-60px)_rotate(-20deg)]"
            style={{
              willChange: 'transform',
            }}
          />
          <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 dark:from-amber-500 dark:via-orange-500 dark:to-amber-500 bg-clip-text text-transparent">
            Brewtiful
          </h1>
        </div>

        {/* Tagline with sparkle effect */}
        <div className="flex items-center justify-center gap-2 animate-fade-in-delay-1">
          <Sparkles className="w-5 h-5 text-amber-500 animate-slow-pulse" />
          <p className="text-xl md:text-2xl text-muted-foreground font-medium">
            Your new favourite bartender, serving ML-powered beer recommendations!
          </p>
          <Sparkles className="w-5 h-5 text-amber-500 animate-slow-pulse" />
        </div>

        {/* Feature highlights */}
        <div className="grid md:grid-cols-3 gap-6 py-8 animate-fade-in-delay-2">
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
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4 animate-fade-in-delay-3">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold px-8 py-6 text-lg group"
          >
            <Link href={isLoggedIn ? '/recommendations' : '/login'}>
              {isLoggedIn ? 'See Recommendations' : 'Sign In for Recommendations'}
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>

          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-amber-600 dark:border-amber-500 text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 font-semibold px-8 py-6 text-lg group"
          >
            <Link href="/beers">
              Browse Beers
              <Beer className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform" />
            </Link>
          </Button>
        </div>

        {/* Secondary link */}
        <div className="pt-4 animate-fade-in-delay-4">
          <Link
            href="/breweries"
            className="text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline inline-flex items-center gap-1"
          >
            Or explore breweries
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
