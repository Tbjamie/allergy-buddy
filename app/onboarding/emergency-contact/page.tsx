import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EmergencyContactStep from '@/features/onboarding/components/EmergencyContactStep'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Selecteer noodgevallcontact | AllergyBuddy',
  description: 'Kies je noodgevallcontact in de AllergyBuddy app om gepersonaliseerde allergie-ervaringen te ontdekken.',
}

export default async function OnboardingEmergencyContactPage() {
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
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relation,
      emergency_contact_relation_custom,
      emergency_contact_language,
      emergency_contact_note
    `)
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    redirect('/onboarding')
  }

  if (profile.onboarding_completed) {
    redirect('/')
  }

  if ((profile.onboarding_step ?? 0) < 4) {
    redirect('/onboarding')
  }

  return <EmergencyContactStep profile={profile} />
}