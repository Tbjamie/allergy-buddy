import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TravelStep from '@/features/onboarding/components/TravelStep'

export default async function OnboardingTravelPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      id,
      onboarding_step,
      onboarding_completed,
      destination_country,
      destination_city,
      current_country,
      current_city,
      location_sharing_enabled
    `)
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    redirect('/onboarding')
  }

  if (profile.onboarding_completed) {
    redirect('/')
  }

  if ((profile.onboarding_step ?? 0) < 5) {
    redirect('/onboarding')
  }

  return <TravelStep profile={profile} />
}