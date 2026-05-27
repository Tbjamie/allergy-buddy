import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AccountMedicalEditPage from '@/features/account/components/AccountMedicalEditPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Medische informatie aanpassen | AllergyBuddy',
  description: 'Pas je medische informatie aan.',
}

export type AccountMedicalEditProfile = {
  id: string
  onboarding_completed: boolean | null
  has_other_medical_conditions: boolean | null
  diabetes: boolean | null
  asthma: boolean | null
  heart_condition: boolean | null
  epilepsy: boolean | null
  medical_notes: string | null
  medication_notes: string | null
}

export default async function AccountMedicalEditRoutePage() {
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
      has_other_medical_conditions,
      diabetes,
      asthma,
      heart_condition,
      epilepsy,
      medical_notes,
      medication_notes
    `)
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    redirect('/onboarding')
  }

  if (!profile.onboarding_completed) {
    redirect('/onboarding')
  }

  return <AccountMedicalEditPage profile={profile as AccountMedicalEditProfile} />
}