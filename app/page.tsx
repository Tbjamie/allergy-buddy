import { createClient } from '@/lib/supabase/server'
import AuthOnboarding from '@/features/auth/components/AuthOnboarding'
import RestaurantHome from '@/features/restaurants/components/RestaurantHome'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AllergyBuddy',
  description: 'Community-based allergiehulp voor reizigers.',
}

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <AuthOnboarding />
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      id,
      onboarding_completed,
      destination_country,
      destination_city,
      location_sharing_enabled
    `)
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || !profile.onboarding_completed) {
    redirect('/onboarding')
  }

  const restaurantsQuery = supabase
    .from('restaurants_with_primary_image')
    .select(`
      id,
      slug,
      name,
      country,
      city,
      address,
      latitude,
      longitude,
      cuisine_type,
      google_maps_url,
      website_url,
      phone,
      community_confidence,
      review_count,
      community_rating,
      last_reviewed_at,
      metadata,
      primary_image_url,
      primary_image_alt,
      primary_image_caption,
      latest_review_text,
      latest_review_title,
      latest_review_warning_text,
      latest_review_created_at
    `)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .order('review_count', { ascending: false })
    .limit(100)

  const { data: restaurants, error: restaurantsError } = await restaurantsQuery

  if (restaurantsError) {
    console.error(restaurantsError)
  }

  return (
    <RestaurantHome
      profile={profile}
      restaurants={restaurants ?? []}
    />
  )
}