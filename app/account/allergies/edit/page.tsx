import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AccountAllergiesEditPage from '@/features/account/components/AccountAllergiesEditPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Allergieën aanpassen | AllergyBuddy',
  description: 'Pas je allergieën en allergiegegevens aan.',
}

export type AccountEditAllergen = {
  id: string
  name_nl: string
  name_en: string | null
  name_tr: string | null
  slug: string
  icon_url: string | null
}

export type AccountEditProfileAllergen = {
  id: string
  profile_id: string
  allergen_id: string
  severity: 'mild' | 'moderate' | 'severe' | 'anaphylaxis_risk' | 'unknown' | null
  causes_anaphylaxis: boolean | null
  cross_contamination_sensitive: boolean | null
  reaction_description: string | null
  user_notes: string | null
}

export default async function AccountAllergiesEditRoutePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    redirect('/onboarding')
  }

  if (!profile.onboarding_completed) {
    redirect('/onboarding')
  }

  const { data: allergens, error: allergensError } = await supabase
    .from('allergens')
    .select(`
      id,
      name_nl,
      name_en,
      name_tr,
      slug,
      icon_url
    `)
    .order('name_nl', { ascending: true })

  if (allergensError) {
    console.error(allergensError)
  }

  const { data: profileAllergens, error: profileAllergensError } = await supabase
    .from('profile_allergens')
    .select(`
      id,
      profile_id,
      allergen_id,
      severity,
      causes_anaphylaxis,
      cross_contamination_sensitive,
      reaction_description,
      user_notes
    `)
    .eq('profile_id', profile.id)

  if (profileAllergensError) {
    console.error(profileAllergensError)
  }

  return (
    <AccountAllergiesEditPage
      profileId={profile.id}
      allergens={(allergens ?? []) as AccountEditAllergen[]}
      profileAllergens={(profileAllergens ?? []) as AccountEditProfileAllergen[]}
    />
  )
}