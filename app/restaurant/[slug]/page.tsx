import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

type RestaurantPageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function RestaurantDetailPage({ params }: RestaurantPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: restaurant } = await supabase
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
      last_reviewed_at,
      metadata
    `)
    .eq('slug', slug)
    .maybeSingle()

  if (!restaurant) {
    notFound()
  }

  return (
    <main className="min-h-dvh bg-background px-fluid-main pb-10 pt-10">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-sm font-bold text-primary">
          ← Terug naar kaart
        </Link>

        <section className="mt-8">
          <h1 className="text-[32px] font-black leading-tight text-foreground">
            {restaurant.name}
          </h1>

          <p className="mt-3 text-sm font-medium text-dark-gray">
            {[restaurant.city, restaurant.cuisine_type].filter(Boolean).join(' · ')}
          </p>

          {restaurant.address && (
            <p className="mt-5 text-sm leading-6 text-foreground">
              {restaurant.address}
            </p>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-foreground/15 bg-white p-4">
          <p className="text-sm font-black text-foreground">Allergie-ervaringen</p>
          <p className="mt-2 text-3xl font-black text-primary">
            {restaurant.review_count ?? 0}
          </p>
          <p className="mt-2 text-xs leading-5 text-dark-gray">
            Dit is gebaseerd op community-informatie. AllergyBuddy geeft geen garantie dat eten
            veilig is.
          </p>
        </section>

        <section className="mt-4 space-y-3">
          {restaurant.google_maps_url && (
            <a
              href={restaurant.google_maps_url}
              target="_blank"
              rel="noreferrer"
              className="flex h-12 items-center justify-center rounded-xl bg-foreground text-sm font-bold text-white"
            >
              Open in Google Maps
            </a>
          )}

          {restaurant.website_url && (
            <a
              href={restaurant.website_url}
              target="_blank"
              rel="noreferrer"
              className="flex h-12 items-center justify-center rounded-xl border border-foreground/20 text-sm font-bold text-foreground"
            >
              Website bekijken
            </a>
          )}

          {restaurant.phone && (
            <a
              href={`tel:${restaurant.phone}`}
              className="flex h-12 items-center justify-center rounded-xl border border-foreground/20 text-sm font-bold text-foreground"
            >
              Bel restaurant
            </a>
          )}
        </section>
      </div>
    </main>
  )
}