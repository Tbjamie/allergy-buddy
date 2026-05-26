import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RoleStep from '@/features/onboarding/components/RoleStep'

export default async function OnboardingRolePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, onboarding_completed')
    .eq('id', user.id)
    .single()

  if (profile?.onboarding_completed) {
    redirect('/')
  }

  return <RoleStep profile={profile} />
}