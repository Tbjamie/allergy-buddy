import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OrderHelpPage from '@/features/ordering/components/OrderHelpPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bestelhulp | AllergyBuddy',
  description: 'Stel belangrijke allergievragen in het restaurant.',
}

export type OrderHelpProfile = {
  id: string
  onboarding_completed: boolean | null
  destination_country: string | null
  current_country: string | null
}

export type OrderHelpProfileAllergen = {
  id: string
  profile_id: string
  allergen_id: string
  severity: string | null
  causes_anaphylaxis: boolean | null
  cross_contamination_sensitive: boolean | null
  allergens:
    | {
        id: string
        name_nl: string
        name_en: string | null
        name_tr: string | null
        slug: string
      }
    | {
        id: string
        name_nl: string
        name_en: string | null
        name_tr: string | null
        slug: string
      }[]
    | null
}

export default async function OrderHelpRoutePage() {
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
      destination_country,
      current_country
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

  const { data: rawProfileAllergens, error: allergensError } = await supabase
    .from('profile_allergens')
    .select(`
      id,
      profile_id,
      allergen_id,
      severity,
      causes_anaphylaxis,
      cross_contamination_sensitive,
      allergens (
        id,
        name_nl,
        name_en,
        name_tr,
        slug
      )
    `)
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: true })

  if (allergensError) {
    console.error(allergensError)
  }

  const profileAllergens = ((rawProfileAllergens ?? []) as OrderHelpProfileAllergen[]).map(
    (item) => ({
      ...item,
      allergens: Array.isArray(item.allergens) ? item.allergens[0] ?? null : item.allergens,
    })
  )

  return (
    <OrderHelpPage
      profile={profile as OrderHelpProfile}
      profileAllergens={profileAllergens}
    />
  )
}