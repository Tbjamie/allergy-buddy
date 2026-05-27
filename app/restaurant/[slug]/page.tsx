import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import RestaurantDetailContent from '@/features/restaurants/components/RestaurantDetailContent'

type RestaurantPageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function RestaurantDetailPage({ params }: RestaurantPageProps) {
  const { slug } = await params
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

  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
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
      metadata
    `)
    .eq('slug', slug)
    .maybeSingle()

  if (restaurantError) {
    console.error(restaurantError)
  }

  if (!restaurant) {
    notFound()
  }

  const { data: images, error: imagesError } = await supabase
    .from('restaurant_images')
    .select(`
      id,
      image_url,
      alt_text,
      caption,
      is_primary,
      sort_order
    `)
    .eq('restaurant_id', restaurant.id)
    .order('is_primary', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (imagesError) {
    console.error(imagesError)
  }

  const { data: reviews, error: reviewsError } = await supabase
    .from('restaurant_reviews')
    .select(`
      id,
      restaurant_id,
      profile_id,
      title,
      review_text,
      warning_text,
      recommended_dishes,
      dishes_to_avoid,
      allergy_context,
      allergy_experience_rating,
      communication_rating,
      confidence_after_visit,
      staff_understood_allergy,
      staff_spoke_english,
      staff_checked_with_kitchen,
      cross_contamination_discussed,
      separate_preparation_possible,
      felt_taken_seriously,
      would_return,
      visited_at,
      created_at
    `)
    .eq('restaurant_id', restaurant.id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (reviewsError) {
    console.error(reviewsError)
  }

  return (
    <RestaurantDetailContent
      profileId={profile.id}
      restaurant={restaurant}
      images={images ?? []}
      reviews={reviews ?? []}
    />
  )
}