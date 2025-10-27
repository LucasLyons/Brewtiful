import { createClient } from '@/lib/supabase/server'
import { SplashPage } from '@/components/layout/splash-page'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Show splash page for unauthenticated users
  if (!user) {
    return <SplashPage />
  }

  // TODO: Show personalized recommendations for authenticated users
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Welcome back, {user.user_metadata?.display_name || user.email}!</h1>
        <p className="text-muted-foreground">
          Personalized recommendations coming soon...
        </p>
      </div>
    </main>
  )
}
