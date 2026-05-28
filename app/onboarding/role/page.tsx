import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RoleStep from '@/features/onboarding/components/RoleStep'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Selecteer rol | AllergyBuddy',
  description: 'Kies je rol als gebruiker of restaurant in de AllergyBuddy app om gepersonaliseerde allergie-ervaringen te ontdekken.',
}

export default async function OnboardingRolePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, onboarding_completed')
    .eq('id', user.id)
    .single()

  if (profile?.onboarding_completed) {
    redirect('/')
  }

  return <RoleStep profile={profile} />
}