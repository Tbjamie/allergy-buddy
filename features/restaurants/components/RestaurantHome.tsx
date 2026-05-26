'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import RestaurantMap from './RestaurantMap'
import BottomNavigation from '@/components/layout/BottomNavigation'

type ViewMode = 'map' | 'list'
type LocationMode = 'current' | 'trip' | 'custom'

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

type Filters = {
  locationMode: LocationMode
  customLocationQuery: string
  minRating: number
  maxDistanceKm: number | null
  minReviews: number
  cuisine: string
}

const defaultFilters: Filters = {
  locationMode: 'trip',
  customLocationQuery: '',
  minRating: 0,
  maxDistanceKm: null,
  minReviews: 0,
  cuisine: 'all',
}

export default function RestaurantHome({ profile, restaurants }: RestaurantHomeProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('map')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<Filters>(() => ({
    ...defaultFilters,
    locationMode: profile.location_sharing_enabled ? 'current' : 'trip',
  }))
  const [activeLocation, setActiveLocation] = useState<LocationPoint | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [customMapLocation, setCustomMapLocation] = useState<string | null>(null)

  useEffect(() => {
    resolveLocationForFilters({
      filters,
      profile,
      onResolved: setActiveLocation,
      onError: setLocationError,
      onCustomMapLocation: setCustomMapLocation,
    })
  }, [filters.locationMode, filters.customLocationQuery, profile.destination_city, profile.destination_country, filters, profile])

  const cuisineOptions = useMemo(() => {
    const cuisines = restaurants
      .flatMap((restaurant) => restaurant.cuisine_type?.split(',') ?? [])
      .map((item) => item.trim())
      .filter(Boolean)

    return Array.from(new Set(cuisines)).sort((a, b) => a.localeCompare(b))
  }, [restaurants])

  const visibleRestaurants = useMemo(() => {
    const filtered = restaurants.filter((restaurant) => {
      const rating = Number(restaurant.community_rating ?? 0)
      const reviews = restaurant.review_count ?? 0

      if (rating < filters.minRating) return false
      if (reviews < filters.minReviews) return false

      if (
        filters.cuisine !== 'all' &&
        !restaurant.cuisine_type?.toLowerCase().includes(filters.cuisine.toLowerCase())
      ) {
        return false
      }

      if (
        filters.maxDistanceKm !== null &&
        activeLocation &&
        restaurant.latitude !== null &&
        restaurant.longitude !== null
      ) {
        const distance = getDistanceInKm(activeLocation, {
          latitude: Number(restaurant.latitude),
          longitude: Number(restaurant.longitude),
        })

        if (distance > filters.maxDistanceKm) return false
      }

      return true
    })

    return sortRestaurants(filtered, activeLocation)
  }, [restaurants, filters, activeLocation])

  const mapRestaurants = visibleRestaurants
    .filter((restaurant) => restaurant.latitude !== null && restaurant.longitude !== null)
    .map((restaurant) => ({
      id: restaurant.id,
      slug: restaurant.slug ?? restaurant.id,
      name: restaurant.name,
      city: restaurant.city ?? '',
      latitude: Number(restaurant.latitude),
      longitude: Number(restaurant.longitude),
      allergyExperienceCount: restaurant.review_count ?? 0,
      communityRating: Number(restaurant.community_rating ?? 0),
    }))

  const activeFilterCount = getActiveFilterCount(filters)

  return (
    <main className="relative h-dvh overflow-hidden bg-background">
      <div className="absolute inset-0">
        {viewMode === 'map' ? (
          <RestaurantMap
            restaurants={mapRestaurants}
            destinationCountry={
              filters.locationMode === 'custom' ? null : profile.destination_country
            }
            destinationCity={
              filters.locationMode === 'custom'
                ? customMapLocation
                : profile.destination_city
            }
            locationSharingEnabled={filters.locationMode === 'current'}
          />
        ) : (
          <RestaurantList restaurants={visibleRestaurants} userLocation={activeLocation} />
        )}
      </div>

      <div className="pointer-events-none absolute left-0 right-0 top-16 z-20 px-fluid-main">
        <div className="mx-auto flex max-w-md items-center gap-4">
          <div className="pointer-events-auto flex h-14 w-full overflow-hidden rounded-2xl bg-foreground p-2">
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={[
                'flex h-full w-full min-w-24 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors',
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
                'flex h-full w-full min-w-24 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors',
                viewMode === 'list' ? 'bg-white/20 text-white' : 'text-white',
              ].join(' ')}
            >
              ☰
              Lijst
            </button>
          </div>

          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="pointer-events-auto relative flex h-14 w-1/2 items-center justify-center rounded-2xl bg-foreground text-white"
            aria-label="Filters openen"
          >
            ⚙️

            {activeFilterCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-black text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <FilterSheet
        open={filtersOpen}
        filters={filters}
        restaurants={restaurants}
        visibleCount={visibleRestaurants.length}
        cuisineOptions={cuisineOptions}
        activeLocation={activeLocation}
        locationError={locationError}
        onChange={setFilters}
        onClose={() => setFiltersOpen(false)}
        onReset={() => setFilters(defaultFilters)}
      />

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
            Er zijn geen restaurants die passen bij je huidige filters.
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

              {latestQuote && (
                <p className="mt-3 line-clamp-1 px-4 text-sm font-medium italic leading-6 text-foreground/80">
                  “{latestQuote}”
                </p>
              )}

              <p className={['mt-3 px-4 pb-4 text-sm font-bold', ratingStyles.text].join(' ')}>
                {reviewCount} allergie-ervaringen
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

function FilterSheet({
  open,
  filters,
  restaurants,
  visibleCount,
  cuisineOptions,
  activeLocation,
  locationError,
  onChange,
  onClose,
  onReset,
}: {
  open: boolean
  filters: Filters
  restaurants: Restaurant[]
  visibleCount: number
  cuisineOptions: string[]
  activeLocation: LocationPoint | null
  locationError: string | null
  onChange: (filters: Filters) => void
  onClose: () => void
  onReset: () => void
}) {
  if (!open) return null

  const totalCount = restaurants.length

  return (
    <div className="fixed inset-0 z-80">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/35"
        aria-label="Filters sluiten"
        onClick={onClose}
      />

      <div className="absolute bottom-0 left-1/2 max-h-[88dvh] w-full max-w-md -translate-x-1/2 overflow-y-auto rounded-t-4xl bg-background px-fluid-main pb-8 pt-4 shadow-2xl">
        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-foreground/20" />

        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-foreground">Filters</h2>
            <p className="mt-1 text-sm leading-6 text-dark-gray">
              {visibleCount} van {totalCount} restaurants zichtbaar
            </p>
          </div>

          <button
            type="button"
            onClick={onReset}
            className="rounded-full bg-foreground/5 px-4 py-2 text-xs font-black text-foreground"
          >
            Reset
          </button>
        </div>

        <section className="mt-6">
          <p className="mb-3 text-sm font-black text-foreground">Locatie</p>

          <div className="grid grid-cols-3 gap-2">
            <FilterChip
              active={filters.locationMode === 'current'}
              label="Huidig"
              onClick={() => onChange({ ...filters, locationMode: 'current' })}
            />
            <FilterChip
              active={filters.locationMode === 'trip'}
              label="Reis"
              onClick={() => onChange({ ...filters, locationMode: 'trip' })}
            />
            <FilterChip
              active={filters.locationMode === 'custom'}
              label="Anders"
              onClick={() => onChange({ ...filters, locationMode: 'custom' })}
            />
          </div>

          {filters.locationMode === 'custom' && (
            <input
              type="text"
              value={filters.customLocationQuery}
              onChange={(event) =>
                onChange({
                  ...filters,
                  customLocationQuery: event.target.value,
                })
              }
              placeholder="Bijvoorbeeld: Antalya, Almere of Amsterdam"
              className="mt-3 h-12 w-full rounded-xl border border-foreground/20 bg-white px-4 text-sm font-medium text-foreground outline-none placeholder:text-dark-gray/60 focus:border-primary"
            />
          )}

          <p className="mt-3 text-xs leading-5 text-dark-gray">
            {activeLocation
              ? 'We gebruiken deze locatie om afstand en volgorde te bepalen.'
              : 'Afstand wordt pas toegepast zodra een locatie bekend is.'}
          </p>

          {locationError && <p className="mt-2 text-xs font-bold text-red">{locationError}</p>}
        </section>

        <section className="mt-6">
          <p className="mb-3 text-sm font-black text-foreground">Maximale afstand</p>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Alles', value: null },
              { label: '2 km', value: 2 },
              { label: '5 km', value: 5 },
              { label: '10 km', value: 10 },
              { label: '25 km', value: 25 },
              { label: '50 km', value: 50 },
            ].map((option) => (
              <FilterChip
                key={option.label}
                active={filters.maxDistanceKm === option.value}
                label={option.label}
                onClick={() => onChange({ ...filters, maxDistanceKm: option.value })}
              />
            ))}
          </div>
        </section>

        <section className="mt-6">
          <p className="mb-3 text-sm font-black text-foreground">Minimale score</p>

          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Alles', value: 0 },
              { label: '6+', value: 6 },
              { label: '8+', value: 8 },
              { label: '9+', value: 9 },
            ].map((option) => (
              <FilterChip
                key={option.label}
                active={filters.minRating === option.value}
                label={option.label}
                onClick={() => onChange({ ...filters, minRating: option.value })}
              />
            ))}
          </div>
        </section>

        <section className="mt-6">
          <p className="mb-3 text-sm font-black text-foreground">Minimaal aantal ervaringen</p>

          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Alles', value: 0 },
              { label: '3+', value: 3 },
              { label: '10+', value: 10 },
              { label: '25+', value: 25 },
            ].map((option) => (
              <FilterChip
                key={option.label}
                active={filters.minReviews === option.value}
                label={option.label}
                onClick={() => onChange({ ...filters, minReviews: option.value })}
              />
            ))}
          </div>
        </section>

        <section className="mt-6">
          <p className="mb-3 text-sm font-black text-foreground">Keuken</p>

          <select
            value={filters.cuisine}
            onChange={(event) => onChange({ ...filters, cuisine: event.target.value })}
            className="h-12 w-full rounded-xl border border-foreground/20 bg-white px-4 text-sm font-bold text-foreground outline-none focus:border-primary"
          >
            <option value="all">Alle keukens</option>
            {cuisineOptions.map((cuisine) => (
              <option key={cuisine} value={cuisine}>
                {cuisine}
              </option>
            ))}
          </select>
        </section>

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-13 flex-1 rounded-xl border border-foreground/20 text-sm font-black text-foreground"
          >
            Sluiten
          </button>

          <button
            type="button"
            onClick={onClose}
            className="h-13 flex-[1.5] rounded-xl bg-primary text-sm font-black text-white"
          >
            Toon {visibleCount} resultaten
          </button>
        </div>
      </div>
    </div>
  )
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'min-h-11 rounded-xl border px-3 text-sm font-black transition-all',
        active
          ? 'border-transparent bg-linear-to-r from-foreground to-primary text-white'
          : 'border-foreground/20 bg-white text-foreground',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

async function resolveLocationForFilters({
  filters,
  profile,
  onResolved,
  onError,
  onCustomMapLocation,
}: {
  filters: Filters
  profile: RestaurantHomeProps['profile']
  onResolved: (location: LocationPoint | null) => void
  onError: (error: string | null) => void
  onCustomMapLocation: (location: string | null) => void
}) {
  onError(null)

  if (filters.locationMode === 'current') {
    if (!navigator.geolocation) {
      onResolved(null)
      onError('Je browser ondersteunt locatie delen niet.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onResolved({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      () => {
        onResolved(null)
        onError('Locatie kon niet worden opgehaald.')
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 1000 * 60 * 5,
      }
    )

    return
  }

  if (filters.locationMode === 'custom') {
    const query = filters.customLocationQuery.trim()
    onCustomMapLocation(query || null)

    if (!query) {
      onResolved(null)
      return
    }

    const geocodedLocation = await geocodeLocation(query)
    onResolved(geocodedLocation)
    return
  }

  const tripQuery = [profile.destination_city, profile.destination_country].filter(Boolean).join(', ')

  if (!tripQuery) {
    onResolved(null)
    return
  }

  onCustomMapLocation(null)

  const geocodedLocation = await geocodeLocation(tripQuery)
  onResolved(geocodedLocation)
}

async function geocodeLocation(query: string): Promise<LocationPoint | null> {
  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

  if (!accessToken) return null

  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`
  )

  url.searchParams.set('access_token', accessToken)
  url.searchParams.set('limit', '1')
  url.searchParams.set('types', 'place,locality,region,country')

  const response = await fetch(url.toString())

  if (!response.ok) return null

  const data = await response.json()
  const firstFeature = data.features?.[0]

  if (!firstFeature?.center) return null

  const [longitude, latitude] = firstFeature.center

  return {
    latitude,
    longitude,
  }
}

function getActiveFilterCount(filters: Filters) {
  let count = 0

  if (filters.locationMode !== defaultFilters.locationMode) count += 1
  if (filters.customLocationQuery.trim()) count += 1
  if (filters.minRating !== defaultFilters.minRating) count += 1
  if (filters.maxDistanceKm !== defaultFilters.maxDistanceKm) count += 1
  if (filters.minReviews !== defaultFilters.minReviews) count += 1
  if (filters.cuisine !== defaultFilters.cuisine) count += 1

  return count
}

function getRatingStyles(value: number) {
  if (value <= 4) {
    return {
      badge: 'bg-red/10 text-red',
      text: 'text-red',
      hex: '#D53600',
      bgHex: '#FBE9E3',
    }
  }

  if (value <= 6) {
    return {
      badge: 'bg-orange-100 text-orange-600',
      text: 'text-orange-600',
      hex: '#EA580C',
      bgHex: '#FFEDD5',
    }
  }

  if (value <= 8) {
    return {
      badge: 'bg-amber/20 text-amber-700',
      text: 'text-amber-700',
      hex: '#B77900',
      bgHex: '#FFF3CC',
    }
  }

  return {
    badge: 'bg-primary/10 text-primary',
    text: 'text-primary',
    hex: '#008080',
    bgHex: '#DDEEEE',
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

    if (distanceBlockA !== distanceBlockB) return distanceBlockA - distanceBlockB
    if (ratingA !== ratingB) return ratingB - ratingA
    if (reviewsA !== reviewsB) return reviewsB - reviewsA
    if (distanceA !== null && distanceB !== null) return distanceA - distanceB

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