import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SOSPage from '@/features/emergency/components/SOSPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SOS | AllergyBuddy',
  description: 'Noodhulp bij ernstige allergische reacties.',
}

export type SOSProfile = {
  id: string
  onboarding_completed: boolean | null
  has_epipen: boolean | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relation: string | null
  emergency_contact_relation_custom: string | null
  destination_country: string | null
  current_country: string | null
  location_sharing_enabled: boolean | null
}

export default async function SOSRoutePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
      id,
      onboarding_completed,
      has_epipen,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relation,
      emergency_contact_relation_custom,
      destination_country,
      current_country,
      location_sharing_enabled
    `)
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    console.error(error)
  }

  if (!profile) {
    redirect('/onboarding')
  }

  if (!profile.onboarding_completed) {
    redirect('/onboarding')
  }

  return <SOSPage profile={profile as SOSProfile} />
}