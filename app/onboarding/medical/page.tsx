import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MedicalStep from '@/features/onboarding/components/MedicalStep'

export default async function OnboardingMedicalPage() {
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

  if (profile.onboarding_completed) {
    redirect('/')
  }

  if ((profile.onboarding_step ?? 0) < 3) {
    redirect('/onboarding')
  }

  return <MedicalStep profile={profile} />
}