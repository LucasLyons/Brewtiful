import { SplashPage } from '@/components/layout/splash-page'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen">
      <SplashPage isLoggedIn={!!user} />
    </div>
  )
}
