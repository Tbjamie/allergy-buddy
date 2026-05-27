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
              <svg className='w-5 h-5' viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6.11365 1.10593V1.99987M6.11365 4.23474V5.12869M6.11365 7.36356V8.2575M6.11365 10.4924V11.3863M6.11365 13.6212V14.0682" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M12.3713 3.3408V4.23474M12.3713 6.46961V7.36356M12.3713 9.59843V10.4924M12.3713 12.7272V13.6212M12.3713 15.8561V16.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M0.75 14.6158V3.89328C0.75 3.55468 0.941305 3.24514 1.24416 3.09372L5.74285 0.844378C5.97803 0.726779 6.25307 0.718698 6.49477 0.822279L12.3713 3.3408H17.735C18.2287 3.3408 18.6289 3.74103 18.6289 4.23474V15.8561C18.6289 16.3498 18.2287 16.75 17.735 16.75H12.3713L6.11368 14.0682L1.92664 15.4639C1.34778 15.6568 0.75 15.2259 0.75 14.6158Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
</svg>
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
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fillRule="evenodd" clipRule="evenodd" d="M2.5 4.16667C2.5 3.70644 2.87291 3.33334 3.33292 3.33334H13.3279C13.7879 3.33334 14.1608 3.70644 14.1608 4.16667C14.1608 4.6269 13.7879 5 13.3279 5H3.33292C2.87291 5 2.5 4.6269 2.5 4.16667Z" fill="currentColor"/>
<path fillRule="evenodd" clipRule="evenodd" d="M2.5 10C2.5 9.53975 2.87291 9.16666 3.33292 9.16666H13.3279C13.7879 9.16666 14.1608 9.53975 14.1608 10C14.1608 10.4602 13.7879 10.8333 13.3279 10.8333H3.33292C2.87291 10.8333 2.5 10.4602 2.5 10Z" fill="currentColor"/>
<path fillRule="evenodd" clipRule="evenodd" d="M2.5 15.8333C2.5 15.3731 2.87291 15 3.33292 15H13.3279C13.7879 15 14.1608 15.3731 14.1608 15.8333C14.1608 16.2936 13.7879 16.6667 13.3279 16.6667H3.33292C2.87291 16.6667 2.5 16.2936 2.5 15.8333Z" fill="currentColor"/>
<path fillRule="evenodd" clipRule="evenodd" d="M15.8268 4.16667C15.8268 3.70644 16.1997 3.33334 16.6597 3.33334H16.6672C17.1272 3.33334 17.5001 3.70644 17.5001 4.16667C17.5001 4.6269 17.1272 5 16.6672 5H16.6597C16.1997 5 15.8268 4.6269 15.8268 4.16667Z" fill="currentColor"/>
<path fillRule="evenodd" clipRule="evenodd" d="M15.8268 10C15.8268 9.53975 16.1997 9.16666 16.6597 9.16666H16.6672C17.1272 9.16666 17.5001 9.53975 17.5001 10C17.5001 10.4602 17.1272 10.8333 16.6672 10.8333H16.6597C16.1997 10.8333 15.8268 10.4602 15.8268 10Z" fill="currentColor"/>
<path fillRule="evenodd" clipRule="evenodd" d="M15.8268 15.8333C15.8268 15.3731 16.1997 15 16.6597 15H16.6672C17.1272 15 17.5001 15.3731 17.5001 15.8333C17.5001 16.2936 17.1272 16.6667 16.6672 16.6667H16.6597C16.1997 16.6667 15.8268 16.2936 15.8268 15.8333Z" fill="currentColor"/>
</svg>
              Lijst
            </button>
          </div>

          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="pointer-events-auto relative flex h-14 w-1/2 items-center justify-center rounded-2xl bg-foreground text-white"
            aria-label="Filters openen"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15.5 3H13.5C13.2239 3 13 3.22386 13 3.5V6.5C13 6.77614 13.2239 7 13.5 7H15.5C15.7761 7 16 6.77614 16 6.5V3.5C16 3.22386 15.7761 3 15.5 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
<path d="M10.5 10H8.5C8.22386 10 8 10.2239 8 10.5V13.5C8 13.7761 8.22386 14 8.5 14H10.5C10.7761 14 11 13.7761 11 13.5V10.5C11 10.2239 10.7761 10 10.5 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
<path d="M13.5 17H11.5C11.2239 17 11 17.2239 11 17.5V20.5C11 20.7761 11.2239 21 11.5 21H13.5C13.7761 21 14 20.7761 14 20.5V17.5C14 17.2239 13.7761 17 13.5 17Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
<path d="M13 5H3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M11 19H3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M20.5 19H16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M20.5 12H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M20.5 5H18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M5.5 12H3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
</svg>

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
  const totalCount = restaurants.length

  return (
    <div className={`fixed inset-0 z-80 ${!open ? 'pointer-events-none' : ''}`}>
      <button
        type="button"
        className={`absolute inset-0 bg-foreground/35 ${!open ? 'hidden' : ''}`}
        aria-label="Filters sluiten"
        onClick={onClose}
      />

      <div className={`absolute bottom-0 left-1/2 max-h-[88dvh] w-full max-w-md -translate-x-1/2 overflow-y-auto rounded-t-4xl bg-background px-fluid-main pb-8 pt-4 shadow-2xl transition-transform duration-200 ${!open ? 'translate-y-full' : ''}`}>
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