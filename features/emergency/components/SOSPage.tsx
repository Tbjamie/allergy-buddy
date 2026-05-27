'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import BottomNavigation from '@/components/layout/BottomNavigation'
import type { SOSProfile } from '@/app/sos/page'

type SOSPageProps = {
  profile: SOSProfile
}

type EmergencyConfig = {
  countryCode: string
  alarmNumber: string
  ambulanceNumber?: string
  label: string
}

type LocationStatus = 'idle' | 'loading' | 'success' | 'fallback' | 'error'

const emergencyConfigs: EmergencyConfig[] = [
  { countryCode: 'NL', alarmNumber: '112', label: 'Nederland' },
  { countryCode: 'BE', alarmNumber: '112', label: 'België' },
  { countryCode: 'DE', alarmNumber: '112', label: 'Duitsland' },
  { countryCode: 'FR', alarmNumber: '112', label: 'Frankrijk' },
  { countryCode: 'ES', alarmNumber: '112', label: 'Spanje' },
  { countryCode: 'IT', alarmNumber: '112', label: 'Italië' },
  { countryCode: 'TR', alarmNumber: '112', label: 'Turkije' },
  { countryCode: 'GB', alarmNumber: '999', ambulanceNumber: '999', label: 'Verenigd Koninkrijk' },
  { countryCode: 'US', alarmNumber: '911', ambulanceNumber: '911', label: 'Verenigde Staten' },
  { countryCode: 'TH', alarmNumber: '191', ambulanceNumber: '1669', label: 'Thailand' },
  { countryCode: 'MA', alarmNumber: '19', ambulanceNumber: '15', label: 'Marokko' },
  { countryCode: 'AE', alarmNumber: '999', ambulanceNumber: '998', label: 'Verenigde Arabische Emiraten' },
]

export default function SOSPage({ profile }: SOSPageProps) {
  const fallbackCountryCode = profile.current_country || profile.destination_country || 'NL'

  const [detectedCountryCode, setDetectedCountryCode] = useState<string | null>(null)
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle')

  useEffect(() => {
    let cancelled = false

    async function detectCountryFromCurrentLocation() {
      if (!profile.location_sharing_enabled) {
        setLocationStatus('fallback')
        return
      }

      if (!navigator.geolocation) {
        setLocationStatus('fallback')
        return
      }

      const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

      if (!accessToken) {
        console.error('Missing NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN')
        setLocationStatus('fallback')
        return
      }

      setLocationStatus('loading')

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const countryCode = await reverseGeocodeCountryCode({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accessToken,
            })

            if (cancelled) return

            if (countryCode) {
              setDetectedCountryCode(countryCode)
              setLocationStatus('success')
              return
            }

            setLocationStatus('fallback')
          } catch (error) {
            console.error(error)

            if (!cancelled) {
              setLocationStatus('error')
            }
          }
        },
        () => {
          if (!cancelled) {
            setLocationStatus('fallback')
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 1000 * 60 * 5,
        }
      )
    }

    detectCountryFromCurrentLocation()

    return () => {
      cancelled = true
    }
  }, [profile.location_sharing_enabled])

  const activeCountryCode = detectedCountryCode || fallbackCountryCode

  const emergencyConfig = useMemo(() => {
    return (
      emergencyConfigs.find((item) => item.countryCode === activeCountryCode?.toUpperCase()) ??
      emergencyConfigs.find((item) => item.countryCode === 'NL')!
    )
  }, [activeCountryCode])

  const callNumber = emergencyConfig.ambulanceNumber || emergencyConfig.alarmNumber

  const relationLabel = formatRelation(
    profile.emergency_contact_relation,
    profile.emergency_contact_relation_custom
  )

  return (
    <>
      <main className="relative min-h-dvh overflow-hidden bg-linear-to-b from-[#EF4D00] via-[#E14100] to-red pb-32">
        <div className="mx-auto max-w-md px-fluid-main pt-6">
          <section className="rounded-2xl border border-white/20 bg-white/10 px-4 py-4 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-wide text-white/80">
              Eerst doen
            </p>
            <h1 className="mt-2 text-lg font-black leading-tight text-white">
              Gebruik eerst direct je EpiPen / adrenaline-auto-injector bij ernstige klachten.
            </h1>
            <p className="mt-2 text-sm leading-6 text-white/85">
              Bel daarna pas het alarmnummer en volg verdere stappen. Wacht niet af bij benauwdheid,
              zwelling van keel of tong, flauwvallen of snelle verslechtering.
            </p>
          </section>

          <section className="mt-4 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-wide text-white/70">
              Noodnummer locatie
            </p>
            <p className="mt-1 text-sm font-black text-white">
              {emergencyConfig.label} · {callNumber}
            </p>
            <p className="mt-1 text-xs leading-5 text-white/75">
              {getLocationStatusText({
                locationStatus,
                locationSharingEnabled: profile.location_sharing_enabled,
                fallbackLabel:
                  emergencyConfigs.find(
                    (item) => item.countryCode === fallbackCountryCode?.toUpperCase()
                  )?.label ?? 'Nederland',
              })}
            </p>
          </section>

          <section className="flex justify-center pt-10">
            <div className="relative">
              <div className="sos-pulse-glow pointer-events-none absolute inset-0 rounded-full bg-white/25 blur-2xl" />
              <div className="sos-pulse-ring-one pointer-events-none absolute inset-0 rounded-full border-18 border-white/20" />
              <div className="sos-pulse-ring-two pointer-events-none absolute inset-0 rounded-full border-10 border-white/20" />

              <a
                href={`tel:${callNumber}`}
                className="sos-button relative z-10 flex h-72 w-72 items-center justify-center rounded-full border-18 border-[#F3B39F] bg-[#FDE3DA] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] transition-transform duration-200 active:scale-[0.97]"
              >
                <span className="flex h-full w-full flex-col items-center justify-center rounded-full bg-background text-center">
                  <span className="text-[64px] font-black uppercase leading-none text-[#E56434]">
                    SOS
                  </span>
                  <span className="mt-4 px-6 text-sm font-medium leading-5 text-[#E56434]">
                    Bel alarmnummer: {callNumber}
                  </span>
                  <span className="mt-1 text-xs font-bold text-[#E56434]/80">
                    {emergencyConfig.label}
                  </span>
                </span>
              </a>
            </div>
          </section>

          <section className="mt-10 space-y-5">
            <InfoCard title="Wanneer gebruik je SOS?">
              <p className="text-sm font-black text-white">Gebruik SOS direct bij:</p>

              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-white/92">
                <li>benauwdheid of piepende ademhaling</li>
                <li>zwelling van keel, tong of lippen</li>
                <li>flauwvallen, duizeligheid of verwardheid</li>
                <li>snel erger wordende reactie na eten</li>
              </ul>
            </InfoCard>

            <InfoCard title="Wat nu te doen?">
              <ol className="space-y-3 text-sm leading-6 text-white/92">
                <li>1. Gebruik direct je EpiPen / adrenaline-auto-injector</li>
                <li>2. Bel direct {callNumber}</li>
                <li>3. Laat personeel weten dat het om een ernstige allergische reactie gaat</li>
                <li>4. Laat de persoon niet alleen</li>
                <li>5. Controleer ademhaling en bewustzijn</li>
                <li>6. Bel opnieuw of volg instructies van hulpdiensten indien nodig</li>
              </ol>
            </InfoCard>

            {(profile.emergency_contact_name || profile.emergency_contact_phone) && (
              <InfoCard title="Noodcontact">
                <div className="space-y-3">
                  <div>
                    <p className="text-base font-black text-white">
                      {profile.emergency_contact_name ?? 'Noodcontact'}
                    </p>
                    <p className="mt-1 text-sm text-white/80">{relationLabel}</p>
                  </div>

                  {profile.emergency_contact_phone && (
                    <a
                      href={`tel:${profile.emergency_contact_phone}`}
                      className="flex h-12 items-center justify-center rounded-xl bg-white text-sm font-black text-[#D53600]"
                    >
                      Bel noodcontact
                    </a>
                  )}
                </div>
              </InfoCard>
            )}

            <InfoCard title="Toon aan personeel">
              <div className="space-y-5 text-sm leading-6 text-white/92">
                <div>
                  <p className="font-black text-white">Nederlands:</p>
                  <p className="mt-1">
                    Deze persoon heeft mogelijk een ernstige allergische reactie. Gebruik direct een
                    EpiPen indien beschikbaar en bel meteen een ambulance / het alarmnummer.
                  </p>
                </div>

                <div>
                  <p className="font-black text-white">Turks:</p>
                  <p className="mt-1">
                    Bu kişi ciddi bir alerjik reaksiyon geçiriyor olabilir. Mümkünse hemen bir
                    EpiPen kullanın ve derhal ambulans / acil yardım çağırın.
                  </p>
                </div>
              </div>
            </InfoCard>

            <div className="rounded-2xl border border-white/15 bg-[#0B1635] px-5 py-5">
              <p className="text-sm font-black text-white">Extra acties</p>

              <div className="mt-4 grid gap-3">
                <a
                  href={`tel:${callNumber}`}
                  className="flex h-12 items-center justify-center rounded-xl bg-red text-sm font-black text-white"
                >
                  Bel direct {callNumber}
                </a>

                {profile.emergency_contact_phone && (
                  <a
                    href={`tel:${profile.emergency_contact_phone}`}
                    className="flex h-12 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-sm font-black text-white"
                  >
                    Bel noodcontact
                  </a>
                )}

                <Link
                  href="/facts"
                  className="flex h-12 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-sm font-black text-white"
                >
                  Bekijk weetjes
                </Link>
              </div>
            </div>
          </section>
        </div>

        <BottomNavigation />
      </main>

      <style jsx>{`
        .sos-button {
          animation: sosButtonBreath 3s ease-in-out infinite;
        }

        .sos-pulse-glow {
          animation: sosGlow 3s ease-in-out infinite;
        }

        .sos-pulse-ring-one {
          animation: sosRingOne 3s ease-out infinite;
        }

        .sos-pulse-ring-two {
          animation: sosRingTwo 3s ease-out infinite;
          animation-delay: 1.35s;
        }

        @keyframes sosButtonBreath {
          0%,
          100% {
            transform: scale(1);
          }

          50% {
            transform: scale(1.018);
          }
        }

        @keyframes sosGlow {
          0%,
          100% {
            transform: scale(0.96);
            opacity: 0.18;
          }

          50% {
            transform: scale(1.06);
            opacity: 0.36;
          }
        }

        @keyframes sosRingOne {
          0% {
            transform: scale(1);
            opacity: 0.35;
          }

          70% {
            opacity: 0.08;
          }

          100% {
            transform: scale(1.18);
            opacity: 0;
          }
        }

        @keyframes sosRingTwo {
          0% {
            transform: scale(1);
            opacity: 0.28;
          }

          70% {
            opacity: 0.06;
          }

          100% {
            transform: scale(1.28);
            opacity: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .sos-button,
          .sos-pulse-glow,
          .sos-pulse-ring-one,
          .sos-pulse-ring-two {
            animation: none;
          }
        }
      `}</style>
    </>
  )
}

async function reverseGeocodeCountryCode({
  latitude,
  longitude,
  accessToken,
}: {
  latitude: number
  longitude: number
  accessToken: string
}) {
  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json`
  )

  url.searchParams.set('access_token', accessToken)
  url.searchParams.set('limit', '1')
  url.searchParams.set('types', 'country')

  const response = await fetch(url.toString())

  if (!response.ok) {
    return null
  }

  const data = await response.json()
  const firstFeature = data.features?.[0]

  const shortCode = firstFeature?.properties?.short_code

  if (typeof shortCode !== 'string') {
    return null
  }

  return shortCode.toUpperCase()
}

function getLocationStatusText({
  locationStatus,
  locationSharingEnabled,
  fallbackLabel,
}: {
  locationStatus: LocationStatus
  locationSharingEnabled: boolean | null
  fallbackLabel: string
}) {
  if (!locationSharingEnabled) {
    return `Locatie delen staat uit. We gebruiken je reislocatie als fallback: ${fallbackLabel}.`
  }

  if (locationStatus === 'loading') {
    return 'Huidige locatie wordt opgehaald voor het juiste lokale noodnummer.'
  }

  if (locationStatus === 'success') {
    return 'Gebaseerd op je huidige locatie.'
  }

  if (locationStatus === 'error') {
    return `Locatie kon niet worden bepaald. We gebruiken je fallbacklocatie: ${fallbackLabel}.`
  }

  return `Huidige locatie niet beschikbaar. We gebruiken je fallbacklocatie: ${fallbackLabel}.`
}

function InfoCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-3xl bg-[#0B1635] px-5 py-5 shadow-lg">
      <h2 className="text-lg font-medium text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function formatRelation(relation: string | null, custom: string | null) {
  if (relation === 'parent') return 'Ouder'
  if (relation === 'partner') return 'Partner'
  if (relation === 'friend') return 'Vriend(in)'
  if (relation === 'sibling') return 'Broer / zus'
  if (relation === 'travel_companion') return 'Reisgenoot'
  if (relation === 'doctor') return 'Arts'
  if (relation === 'other') return custom || 'Anders'

  return 'Noodcontact'
}