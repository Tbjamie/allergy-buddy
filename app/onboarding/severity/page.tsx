import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SeverityStep from '@/features/onboarding/components/SeverityStep'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Selecteer ernst van allergieën | AllergyBuddy',
  description: 'Kies de ernst van je allergieën in de AllergyBuddy app om gepersonaliseerde allergie-ervaringen te ontdekken.',
}

export default async function OnboardingSeverityPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, onboarding_step, onboarding_completed')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/onboarding')
  }

  if (profile.onboarding_completed) {
    redirect('/')
  }

  if ((profile.onboarding_step ?? 0) < 2) {
    redirect('/onboarding')
  }

  const { data: profileAllergens, error } = await supabase.rpc(
    'get_my_profile_allergens_for_onboarding'
  )

  if (error) {
    console.error(error)
  }

  if (!profileAllergens || profileAllergens.length === 0) {
    redirect('/onboarding/allergies')
  }

  return <SeverityStep profile={profile} profileAllergens={profileAllergens} />
}