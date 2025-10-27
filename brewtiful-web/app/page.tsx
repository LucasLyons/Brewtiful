import { createClient } from '@/lib/supabase/server'
import { SplashPage } from '@/components/layout/splash-page'
import { AuthLandingPage } from '@/components/layout/auth-landing-page'

const MINIMUM_RATINGS_FOR_RECS = 5

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Show splash page for unauthenticated users
  if (!user) {
    return <SplashPage />
  }

  // Get user's rating count
  const { count: ratingCount } = await supabase
    .from('user_ratings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Show onboarding page if user has less than 5 ratings
  if ((ratingCount ?? 0) < MINIMUM_RATINGS_FOR_RECS) {
    return <AuthLandingPage userId={user.id} />
  }

  // TODO: Show personalized recommendations for authenticated users with 5+ ratings
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Welcome back, {user.user_metadata?.display_name || user.email}!</h1>
        <p className="text-muted-foreground">
          Personalized recommendations coming soon...
        </p>
        <p className="text-sm text-muted-foreground">
          You&apos;ve rated {ratingCount} beers!
        </p>
      </div>
    </main>
  )
}
