import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FactsPage from '@/features/facts/components/FactsPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Weetjes | AllergyBuddy',
  description: 'Praktische allergie-weetjes met bronvermelding.',
}

export type AllergyFact = {
  id: string
  slug: string
  title_nl: string
  body_nl: string
  category: 'worsen' | 'help' | 'general' | 'emergency' | 'travel' | 'restaurant'
  tag: string
  source_name: string
  source_url: string
  important: boolean
  sort_order: number
}

export default async function FactsRoutePage() {
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

  if (!profile || !profile.onboarding_completed) {
    redirect('/onboarding')
  }

  const { data: facts, error } = await supabase
    .from('allergy_facts')
    .select(`
      id,
      slug,
      title_nl,
      body_nl,
      category,
      tag,
      source_name,
      source_url,
      important,
      sort_order
    `)
    .eq('is_published', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error(error)
  }

  return <FactsPage facts={(facts ?? []) as AllergyFact[]} />
}