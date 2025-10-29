import { createClient } from '@/lib/supabase/server';
import { AuthLandingPage } from '@/components/layout/auth-landing-page'
import Link from 'next/link';
import { getUserRatedBeersWithEmbeddings } from '@/lib/recommendations/user-kmeans';
import { KMeansRecommendations } from '@/components/recommendations/kmeans-recommendations';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';

const MINIMUM_RATINGS_FOR_RECS = 5

export default async function RecommendationsPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Show login prompt for unauthenticated users
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 dark:from-amber-500 dark:via-orange-500 dark:to-amber-500 bg-clip-text text-transparent">
            Sign In for Personalized Recommendations
          </h1>

          <p className="text-xl text-muted-foreground">
            Get custom beer recommendations based on your unique taste profile
          </p>

          <div className="bg-card border rounded-lg p-8 space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">How it works</h2>
              <ol className="text-left space-y-3 text-muted-foreground">
                <li className="flex gap-3">
                  <span className="font-bold text-amber-600 dark:text-amber-500 min-w-[1.5rem]">1.</span>
                  <span>Sign in with your Google account</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-amber-600 dark:text-amber-500 min-w-[1.5rem]">2.</span>
                  <span>Rate at least 5 beers to build your taste profile</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-amber-600 dark:text-amber-500 min-w-[1.5rem]">3.</span>
                  <span>Get personalized beer recommendations!</span>
                </li>
              </ol>
            </div>

            <div className="pt-4 flex flex-col items-center gap-4">
              <GoogleSignInButton />
              <p className="text-sm text-muted-foreground">
                Or browse our catalog without signing in
              </p>
              <div className="flex gap-4">
                <Link
                  href="/beers"
                  className="text-amber-600 dark:text-amber-500 hover:underline font-medium"
                >
                  Browse Beers
                </Link>
                <span className="text-muted-foreground">•</span>
                <Link
                  href="/breweries"
                  className="text-amber-600 dark:text-amber-500 hover:underline font-medium"
                >
                  Explore Breweries
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Server will fetch data for authenticated users only initially
  const userId = user?.id || null;

   // Get user's rating count
  const { count: ratingCount } = await supabase
    .from('user_ratings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Show onboarding page if user has less than 5 ratings
  if ((ratingCount ?? 0) < MINIMUM_RATINGS_FOR_RECS) {
    return <AuthLandingPage userId={user.id} />
  }

  // Fetch user's rated beers with embeddings
  const ratedBeers = await getUserRatedBeersWithEmbeddings(userId);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Recommendations</h1>
        <p className="text-muted-foreground">
          Personalized beer recommendations based on your tastes!
        </p>
      </div>

      {ratedBeers.length === 0 ? (
        <div className="bg-card border rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">No ratings yet</h2>
          <p className="text-muted-foreground mb-4">
            Start rating some beers to get personalized recommendations!
          </p>
          <Link
            href="/beers"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Browse Beers
          </Link>
        </div>
      ) : (
        <KMeansRecommendations
          ratedBeers={ratedBeers}
          userId={userId}
        />
      )}
    </div>
  );
}
