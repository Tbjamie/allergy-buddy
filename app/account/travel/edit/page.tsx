import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AccountTravelEditPage from '@/features/account/components/AccountTravelEditPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reis aanpassen | AllergyBuddy',
  description: 'Pas je bestemming en locatie-instellingen aan.',
}

export type AccountTravelEditProfile = {
  id: string
  onboarding_completed: boolean | null
  destination_country: string | null
  destination_city: string | null
  current_country: string | null
  current_city: string | null
  location_sharing_enabled: boolean | null
}

export default async function AccountTravelEditRoutePage() {
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

  if (!profile.onboarding_completed) {
    redirect('/onboarding')
  }

  return <AccountTravelEditPage profile={profile as AccountTravelEditProfile} />
}