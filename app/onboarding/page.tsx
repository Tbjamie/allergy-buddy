import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const onboardingRoutes: Record<number, string> = {
  0: '/onboarding/role',
  1: '/onboarding/allergies',
  2: '/onboarding/severity',
  3: '/onboarding/medical',
  4: '/onboarding/emergency-contact',
  5: '/onboarding/travel',
}

export default async function OnboardingPage() {
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
    redirect('/onboarding/role')
  }

  if (profile.onboarding_completed) {
    redirect('/')
  }

  const onboardingStep = profile.onboarding_step ?? 0
  const nextRoute = onboardingRoutes[onboardingStep] ?? '/onboarding/role'

  redirect(nextRoute)
}