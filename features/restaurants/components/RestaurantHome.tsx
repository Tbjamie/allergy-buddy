'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import RestaurantMap from './RestaurantMap'
import BottomNavigation from '@/components/layout/BottomNavigation'

type ViewMode = 'map' | 'list'

type LocationPoint = {
  latitude: number
  longitude: number
}

type Restaurant = {
  id: string
  slug: string | null
  name: string
  country: string | null
  city: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  cuisine_type: string | null
  google_maps_url: string | null
  website_url: string | null
  phone: string | null
  community_confidence: 'low' | 'medium' | 'high' | 'unknown' | null
  review_count: number | null
  community_rating: number | null
  last_reviewed_at: string | null
  metadata: Record<string, unknown> | null
  primary_image_url: string | null
  primary_image_alt: string | null
  primary_image_caption: string | null
  latest_review_text: string | null
  latest_review_title: string | null
  latest_review_warning_text: string | null
  latest_review_created_at: string | null
}

type RestaurantHomeProps = {
  profile: {
    destination_country: string | null
    destination_city: string | null
    location_sharing_enabled: boolean | null
  }
  restaurants: Restaurant[]
}

export default function RestaurantHome({ profile, restaurants }: RestaurantHomeProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('map')
  const [userLocation, setUserLocation] = useState<LocationPoint | null>(null)

  useEffect(() => {
    if (!profile.location_sharing_enabled) return
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      () => {
        setUserLocation(null)
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 1000 * 60 * 5,
      }
    )
  }, [profile.location_sharing_enabled])

  const sortedRestaurants = sortRestaurants(restaurants, userLocation)

  const mapRestaurants = sortedRestaurants
    .filter((restaurant) => restaurant.latitude !== null && restaurant.longitude !== null)
    .map((restaurant) => ({
      id: restaurant.id,
      slug: restaurant.slug ?? restaurant.id,
      name: restaurant.name,
      city: restaurant.city ?? '',
      latitude: Number(restaurant.latitude),
      longitude: Number(restaurant.longitude),
      allergyExperienceCount: restaurant.review_count ?? 0,
    }))

  return (
    <main className="relative h-dvh overflow-hidden bg-background">
      <div className="absolute inset-0">
        {viewMode === 'map' ? (
          <RestaurantMap
            restaurants={mapRestaurants}
            destinationCountry={profile.destination_country}
            destinationCity={profile.destination_city}
            locationSharingEnabled={profile.location_sharing_enabled}
          />
        ) : (
          <RestaurantList restaurants={sortedRestaurants} userLocation={userLocation} />
        )}
      </div>

      <div className="pointer-events-none absolute left-0 right-0 top-16 z-20 px-fluid-main">
        <div className="mx-auto flex max-w-md items-center gap-4">
          <div className="pointer-events-auto flex h-14 overflow-hidden rounded-2xl bg-foreground p-1">
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={[
                'flex min-w-24 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors',
                viewMode === 'map' ? 'bg-white/20 text-white' : 'text-white',
              ].join(' ')}
            >
              🗺️
              Map
            </button>

            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={[
                'flex min-w-24 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors',
                viewMode === 'list' ? 'bg-white/20 text-white' : 'text-white',
              ].join(' ')}
            >
              ☰
              Lijst
            </button>
          </div>

          <button
            type="button"
            className="pointer-events-auto flex h-14 w-28 items-center justify-center rounded-2xl bg-foreground text-white"
            aria-label="Filters openen"
          >
            ⚙️
          </button>
        </div>
      </div>

      <BottomNavigation />
    </main>
  )
}

function RestaurantList({
  restaurants,
  userLocation,
}: {
  restaurants: Restaurant[]
  userLocation: LocationPoint | null
}) {
  if (restaurants.length === 0) {
    return (
      <section className="h-full overflow-y-auto bg-background px-fluid-main pb-32 pt-36">
        <div className="mx-auto max-w-md rounded-2xl border border-foreground/15 bg-white p-5">
          <h2 className="text-lg font-black text-foreground">Geen restaurants gevonden</h2>
          <p className="mt-2 text-sm leading-6 text-dark-gray">
            Er zijn nog geen restaurants beschikbaar voor deze bestemming.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="h-full overflow-y-auto bg-background px-fluid-main pb-32 pt-36">
      <div className="mx-auto max-w-md space-y-4">
        {restaurants.map((restaurant) => {
          const ratingValue = Number(restaurant.community_rating ?? 0)
          const reviewCount = restaurant.review_count ?? 0
          const ratingStyles = getRatingStyles(ratingValue)

          const distance =
            userLocation && restaurant.latitude !== null && restaurant.longitude !== null
              ? getDistanceInKm(userLocation, {
                  latitude: Number(restaurant.latitude),
                  longitude: Number(restaurant.longitude),
                })
              : null

          const latestQuote = restaurant.latest_review_text
            ? getFirstSentence(restaurant.latest_review_text)
            : null

          return (
            <Link
              href={`/restaurant/${encodeURIComponent(restaurant.slug ?? restaurant.id)}`}
              key={restaurant.id}
              className="inline-block w-full rounded-2xl border border-foreground/15 bg-white"
            >
              {restaurant.primary_image_url && (
                <Image
                  src={restaurant.primary_image_url}
                  alt={restaurant.primary_image_alt ?? restaurant.name}
                  className="mb-4 h-48 w-full rounded-xl object-cover"
                  width={400}
                  height={160}
                />
              )}

              <div className="flex items-start justify-between gap-4 px-4">
                <div>
                  <h2 className="text-lg font-black text-foreground">{restaurant.name}</h2>

                  <p className="mt-1 text-sm font-medium text-dark-gray">
                    {[restaurant.city, restaurant.cuisine_type].filter(Boolean).join(' · ')}
                  </p>
                </div>

                <span
                  className={[
                    'shrink-0 rounded-full px-3 py-1 text-xs font-black',
                    ratingStyles.badge,
                  ].join(' ')}
                >
                  {ratingValue.toFixed(1)}
                </span>
              </div>

              {/* {restaurant.address && (
                <p className="mt-3 text-sm px-4 leading-6 text-dark-gray">{restaurant.address}</p>
              )} */}

              {latestQuote && (
                <p className="mt-3 px-4 line-clamp-1 text-sm font-medium leading-6 text-foreground/80">
                  “{latestQuote}”
                </p>
              )}

              <p className={['mt-3 text-sm font-bold px-4 pb-4', ratingStyles.text].join(' ')}>
                {reviewCount} allergie-ervaringen · score {ratingValue.toFixed(1)}/10
                {distance !== null && (
                  <span className="text-dark-gray"> · {distance.toFixed(1)} km</span>
                )}
              </p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function getRatingStyles(value: number) {
  if (value <= 4) {
    return {
      badge: 'bg-red/10 text-red',
      text: 'text-red',
    }
  }

  if (value <= 6) {
    return {
      badge: 'bg-orange-100 text-orange-600',
      text: 'text-orange-600',
    }
  }

  if (value <= 8) {
    return {
      badge: 'bg-amber/20 text-amber-700',
      text: 'text-amber-700',
    }
  }

  return {
    badge: 'bg-primary/10 text-primary',
    text: 'text-primary',
  }
}

function sortRestaurants(restaurants: Restaurant[], userLocation: LocationPoint | null) {
  return [...restaurants].sort((a, b) => {
    const ratingA = Number(a.community_rating ?? 0)
    const ratingB = Number(b.community_rating ?? 0)

    const reviewsA = a.review_count ?? 0
    const reviewsB = b.review_count ?? 0

    const distanceA =
      userLocation && a.latitude !== null && a.longitude !== null
        ? getDistanceInKm(userLocation, {
            latitude: Number(a.latitude),
            longitude: Number(a.longitude),
          })
        : null

    const distanceB =
      userLocation && b.latitude !== null && b.longitude !== null
        ? getDistanceInKm(userLocation, {
            latitude: Number(b.latitude),
            longitude: Number(b.longitude),
          })
        : null

    const distanceBlockA = getDistanceBlock(distanceA)
    const distanceBlockB = getDistanceBlock(distanceB)

    if (distanceBlockA !== distanceBlockB) {
      return distanceBlockA - distanceBlockB
    }

    if (ratingA !== ratingB) {
      return ratingB - ratingA
    }

    if (reviewsA !== reviewsB) {
      return reviewsB - reviewsA
    }

    if (distanceA !== null && distanceB !== null) {
      return distanceA - distanceB
    }

    return a.name.localeCompare(b.name)
  })
}

function getDistanceBlock(distance: number | null) {
  if (distance === null) return 999

  if (distance <= 2) return 0
  if (distance <= 5) return 1
  if (distance <= 10) return 2
  if (distance <= 25) return 3
  if (distance <= 50) return 4

  return 5
}

function getDistanceInKm(from: LocationPoint, to: LocationPoint) {
  const earthRadiusKm = 6371

  const dLat = toRadians(to.latitude - from.latitude)
  const dLon = toRadians(to.longitude - from.longitude)

  const lat1 = toRadians(from.latitude)
  const lat2 = toRadians(to.latitude)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return earthRadiusKm * c
}

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

function getFirstSentence(text: string) {
  const cleanText = text.trim()
  const match = cleanText.match(/[^.!?]+[.!?]/)

  return match?.[0]?.trim() ?? cleanText
}