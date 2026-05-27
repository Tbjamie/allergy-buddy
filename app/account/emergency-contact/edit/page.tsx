import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AccountEmergencyContactEditPage from '@/features/account/components/AccountEmergencyContactEditPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Noodcontact aanpassen | AllergyBuddy',
  description: 'Pas je noodcontact aan.',
}

export type EmergencyContactRelation =
  | 'parent'
  | 'partner'
  | 'friend'
  | 'sibling'
  | 'travel_companion'
  | 'doctor'
  | 'other'

export type AccountEmergencyContactEditProfile = {
  id: string
  onboarding_completed: boolean | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relation: EmergencyContactRelation | null
  emergency_contact_relation_custom: string | null
  emergency_contact_language: string | null
  emergency_contact_note: string | null
}

export default async function AccountEmergencyContactEditRoutePage() {
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

  if (!profile.onboarding_completed) {
    redirect('/onboarding')
  }

  return (
    <AccountEmergencyContactEditPage
      profile={profile as AccountEmergencyContactEditProfile}
    />
  )
}