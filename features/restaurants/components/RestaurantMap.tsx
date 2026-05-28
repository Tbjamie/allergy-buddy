'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'

type RestaurantMarker = {
  id: string
  slug: string
  name: string
  city: string
  latitude: number
  longitude: number
  allergyExperienceCount: number
  communityRating: number
}

type MapCenter = {
  latitude: number
  longitude: number
}

type RestaurantMapProps = {
  restaurants: RestaurantMarker[]
  destinationCountry?: string | null
  destinationCity?: string | null
  locationSharingEnabled?: boolean | null
  fallbackCenter?: MapCenter
}

const DEFAULT_CENTER: MapCenter = {
  latitude: 52.3676,
  longitude: 4.9041,
}

export default function RestaurantMap({
  restaurants,
  destinationCountry,
  destinationCity,
  locationSharingEnabled = false,
  fallbackCenter = DEFAULT_CENTER,
}: RestaurantMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markerRefs = useRef<mapboxgl.Marker[]>([])

  const [center, setCenter] = useState<MapCenter>(fallbackCenter)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    async function resolveInitialCenter() {
      const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

      if (!accessToken) {
        console.error('Missing NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN')
        setCenter(fallbackCenter)
        return
      }

      if (locationSharingEnabled && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCenter({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            })
          },
          async () => {
            const geocodedCenter = await geocodeDestination({
              destinationCountry,
              destinationCity,
              accessToken,
            })

            setCenter(geocodedCenter ?? fallbackCenter)
          },
          {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 1000 * 60 * 5,
          }
        )

        return
      }

      const geocodedCenter = await geocodeDestination({
        destinationCountry,
        destinationCity,
        accessToken,
      })

      setCenter(geocodedCenter ?? fallbackCenter)
    }

    resolveInitialCenter()
  }, [destinationCountry, destinationCity, locationSharingEnabled, fallbackCenter])

  useEffect(() => {
    if (!mapContainerRef.current) return
    if (mapRef.current) return

    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

    if (!accessToken) {
      console.error('Missing NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN')
      return
    }

    mapboxgl.accessToken = accessToken

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [center.longitude, center.latitude],
      zoom: 12,
      attributionControl: false,
    })

    map.addControl(
      new mapboxgl.AttributionControl({
        compact: true,
      }),
      'bottom-right'
    )

    map.addControl(
      new mapboxgl.NavigationControl({
        showCompass: false,
      }),
      'bottom-right'
    )

    map.on('load', () => {
      setMapReady(true)
    })

    mapRef.current = map

    return () => {
      markerRefs.current.forEach((marker) => marker.remove())
      markerRefs.current = []

      map.remove()
      mapRef.current = null
    }
  }, [center.latitude, center.longitude])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    map.flyTo({
      center: [center.longitude, center.latitude],
      zoom: 12,
      essential: true,
    })
  }, [center, mapReady])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    markerRefs.current.forEach((marker) => marker.remove())
    markerRefs.current = []

    restaurants.forEach((restaurant) => {
  const ratingColors = getMapRatingColors(restaurant.communityRating)

  const markerElement = document.createElement('button')
  markerElement.type = 'button'
  markerElement.setAttribute('aria-label', restaurant.name)
  markerElement.className =
    'flex h-10 w-10 items-center justify-center rounded-full border-4 shadow-lg transition-transform duration-200'

  markerElement.style.backgroundColor = ratingColors.color
  markerElement.style.borderColor = '#111827'

  const innerDot = document.createElement('span')
  innerDot.className = 'block h-3 w-3 rounded-full bg-white'
  markerElement.appendChild(innerDot)

  const popup = new mapboxgl.Popup({
    offset: 24,
    closeButton: false,
    className: 'allergybuddy-map-popup',
  }).setHTML(`
    <div style="font-family: Satoshi, sans-serif; min-width: 190px;">
      <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px;">
        <div>
          <strong style="display:block; font-size:14px; color:#111827;">
            ${escapeHtml(restaurant.name)}
          </strong>

          <span style="display:block; margin-top:4px; font-size:12px; color:#666A71;">
            ${escapeHtml(restaurant.city)}
          </span>
        </div>

        <span style="
          flex-shrink:0;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          min-width:34px;
          height:26px;
          padding:0 8px;
          border-radius:999px;
          background:${ratingColors.background};
          color:${ratingColors.color};
          font-size:12px;
          font-weight:800;
        ">
          ${restaurant.communityRating.toFixed(1)}
        </span>
      </div>

      <span style="
        display:block;
        margin-top:10px;
        font-size:12px;
        color:${ratingColors.color};
        font-weight:700;
      ">
        ${restaurant.allergyExperienceCount} allergie-ervaringen
      </span>

      <a
        href="/restaurant/${encodeURIComponent(restaurant.slug)}"
        style="
          display:flex;
          align-items:center;
          justify-content:center;
          margin-top:12px;
          height:36px;
          border-radius:10px;
          background:#008080;
          color:white;
          font-size:12px;
          font-weight:700;
          text-decoration:none;
        "
      >
        Bekijk restaurant
      </a>
    </div>
  `)

  const marker = new mapboxgl.Marker({
    element: markerElement,
    anchor: 'bottom',
  })
    .setLngLat([restaurant.longitude, restaurant.latitude])
    .setPopup(popup)
    .addTo(map)

  markerRefs.current.push(marker)
})
  }, [restaurants, mapReady])

  return <div ref={mapContainerRef} className="h-full w-full" />
}

async function geocodeDestination({
  destinationCountry,
  destinationCity,
  accessToken,
}: {
  destinationCountry?: string | null
  destinationCity?: string | null
  accessToken: string
}): Promise<MapCenter | null> {
  const query = [destinationCity, destinationCountry].filter(Boolean).join(', ')

  if (!query) return null

  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`
  )

  url.searchParams.set('access_token', accessToken)
  url.searchParams.set('limit', '1')
  url.searchParams.set('types', destinationCity ? 'place,locality,region' : 'country')

  const response = await fetch(url.toString())

  if (!response.ok) {
    console.error('Mapbox geocoding failed:', response.status)
    return null
  }

  const data = await response.json()
  const firstFeature = data.features?.[0]

  if (!firstFeature?.center) return null

  const [longitude, latitude] = firstFeature.center

  return {
    latitude,
    longitude,
  }
}

function getMapRatingColors(value: number) {
  if (value <= 4) {
    return {
      color: '#D53600',
      background: '#FBE9E3',
    }
  }

  if (value <= 6) {
    return {
      color: '#EA580C',
      background: '#FFEDD5',
    }
  }

  if (value <= 8) {
    return {
      color: '#B77900',
      background: '#FFF3CC',
    }
  }

  return {
    color: '#008080',
    background: '#DDEEEE',
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}