import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AccountPage from '@/features/account/components/AccountPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Account | AllergyBuddy',
  description: 'Bekijk je AllergyBuddy profiel, allergieën en noodinformatie.',
}

export type AccountProfile = {
  id: string
  email: string | null
  full_name: string | null
  first_name: string | null
  last_name: string | null
  role: string | null
  onboarding_completed: boolean | null

  has_food_allergy: boolean | null
  allergy_severity: string | null
  anaphylaxis_risk: boolean | null
  cross_contamination_sensitive: boolean | null
  has_epipen: boolean | null

  has_other_medical_conditions: boolean | null
  diabetes: boolean | null
  asthma: boolean | null
  heart_condition: boolean | null
  epilepsy: boolean | null
  medical_notes: string | null
  medication_notes: string | null

  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relation: string | null
  emergency_contact_relation_custom: string | null
  emergency_contact_language: string | null
  emergency_contact_note: string | null

  destination_country: string | null
  destination_city: string | null
  current_country: string | null
  current_city: string | null
  location_sharing_enabled: boolean | null
}

export type AccountProfileAllergen = {
  id: string
  profile_id: string
  allergen_id: string
  severity: string | null
  causes_anaphylaxis: boolean | null
  cross_contamination_sensitive: boolean | null
  reaction_description: string | null
  user_notes: string | null
  allergens:
    | {
        id: string
        name_nl: string
        name_en: string | null
        name_tr: string | null
        slug: string
        icon_url: string | null
      }
    | {
        id: string
        name_nl: string
        name_en: string | null
        name_tr: string | null
        slug: string
        icon_url: string | null
      }[]
    | null
}

export default async function AccountRoutePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      first_name,
      last_name,
      role,
      onboarding_completed,

      has_food_allergy,
      allergy_severity,
      anaphylaxis_risk,
      cross_contamination_sensitive,
      has_epipen,

      has_other_medical_conditions,
      diabetes,
      asthma,
      heart_condition,
      epilepsy,
      medical_notes,
      medication_notes,

      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relation,
      emergency_contact_relation_custom,
      emergency_contact_language,
      emergency_contact_note,

      destination_country,
      destination_city,
      current_country,
      current_city,
      location_sharing_enabled
    `)
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error(profileError)
  }

  if (!profile) {
    redirect('/onboarding')
  }

  if (!profile.onboarding_completed) {
    redirect('/onboarding')
  }

  const { data: rawProfileAllergens, error: allergensError } = await supabase
    .from('profile_allergens')
    .select(`
      id,
      profile_id,
      allergen_id,
      severity,
      causes_anaphylaxis,
      cross_contamination_sensitive,
      reaction_description,
      user_notes,
      allergens (
        id,
        name_nl,
        name_en,
        name_tr,
        slug,
        icon_url
      )
    `)
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: true })

  if (allergensError) {
    console.error(allergensError)
  }

  const profileAllergens = ((rawProfileAllergens ?? []) as AccountProfileAllergen[]).map(
    (item) => ({
      ...item,
      allergens: Array.isArray(item.allergens) ? item.allergens[0] ?? null : item.allergens,
    })
  )

  return (
    <AccountPage
      profile={profile as AccountProfile}
      profileAllergens={profileAllergens}
      userEmail={user.email ?? null}
    />
  )
}