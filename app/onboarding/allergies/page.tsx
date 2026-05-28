import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AllergiesStep from '@/features/onboarding/components/AllergiesStep'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Selecteer allergieën | AllergyBuddy',
  description: 'Kies je allergieën in de AllergyBuddy app om gepersonaliseerde allergie-ervaringen te ontdekken.',
}

export default async function OnboardingAllergiesPage() {
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

  const { data: allergens, error: allergensError } = await supabase
    .from('allergens')
    .select('id, name_nl, name_en, name_tr, slug, icon_url')
    .order('name_nl', { ascending: true })

  if (allergensError) {
    console.error(allergensError)
  }

  const { data: selectedAllergens, error: selectedAllergensError } = await supabase
    .from('profile_allergens')
    .select('allergen_id')
    .eq('profile_id', profile.id)

  if (selectedAllergensError) {
    console.error(selectedAllergensError)
  }

  return (
    <AllergiesStep
      profile={profile}
      allergens={allergens ?? []}
      selectedAllergenIds={selectedAllergens?.map((item) => item.allergen_id) ?? []}
    />
  )
}