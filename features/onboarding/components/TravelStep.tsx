'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import ArrowIcon from '@/components/icons/ArrowIcon'
import { createClient } from '@/lib/supabase/client'

type TravelStepProps = {
  profile: {
    id: string
    onboarding_step: number | null
    onboarding_completed: boolean | null
    destination_country: string | null
    destination_city: string | null
    current_country: string | null
    current_city: string | null
    location_sharing_enabled: boolean | null
  }
}

const CURRENT_STEP = 5
const TOTAL_STEPS = 6

const countryOptions = [
  {
    code: 'TR',
    label: 'Turkije',
    flag: '🇹🇷',
  },
  {
    code: 'NL',
    label: 'Nederland',
    flag: '🇳🇱',
  },
  {
    code: 'TH',
    label: 'Thailand',
    flag: '🇹🇭',
  },
  {
    code: 'ES',
    label: 'Spanje',
    flag: '🇪🇸',
  },
  {
    code: 'IT',
    label: 'Italië',
    flag: '🇮🇹',
  },
  {
    code: 'FR',
    label: 'Frankrijk',
    flag: '🇫🇷',
  },
  {
    code: 'DE',
    label: 'Duitsland',
    flag: '🇩🇪',
  },
  {
    code: 'GB',
    label: 'Verenigd Koninkrijk',
    flag: '🇬🇧',
  },
  {
    code: 'US',
    label: 'Verenigde Staten',
    flag: '🇺🇸',
  },
  {
    code: 'MA',
    label: 'Marokko',
    flag: '🇲🇦',
  },
  {
    code: 'AE',
    label: 'Verenigde Arabische Emiraten',
    flag: '🇦🇪',
  },
  {
    code: 'OTHER',
    label: 'Anders',
    flag: '🌍',
  },
]

export default function TravelStep({ profile }: TravelStepProps) {
  const router = useRouter()
  const supabase = createClient()

  const initialCountry = normalizeCountryCode(profile.destination_country)

  const [destinationCountry, setDestinationCountry] = useState(initialCountry)
  const [destinationCity, setDestinationCity] = useState(profile.destination_city ?? '')
  const [customCountry, setCustomCountry] = useState(
    initialCountry === 'OTHER' && profile.destination_country ? profile.destination_country : ''
  )
  const [locationSharingEnabled, setLocationSharingEnabled] = useState(
    profile.location_sharing_enabled ?? false
  )

  const [loading, setLoading] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const selectedCountry = countryOptions.find((country) => country.code === destinationCountry)

  const canContinue =
    destinationCountry !== 'OTHER' ||
    (destinationCountry === 'OTHER' && customCountry.trim().length > 0)

  async function handleRequestLocation() {
    setErrorMessage(null)

    if (!navigator.geolocation) {
      setLocationSharingEnabled(false)
      setErrorMessage('Locatie delen wordt niet ondersteund door deze browser.')
      return
    }

    setLocationLoading(true)

    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationLoading(false)
        setLocationSharingEnabled(true)
        setErrorMessage(null)
      },
      () => {
        setLocationLoading(false)
        setLocationSharingEnabled(false)
        setErrorMessage('Locatie delen is geweigerd of kon niet worden opgehaald.')
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 1000 * 60 * 5,
      }
    )
  }

  async function handleFinish() {
    if (!canContinue) return

    setLoading(true)
    setErrorMessage(null)

    const finalDestinationCountry =
      destinationCountry === 'OTHER' ? customCountry.trim() : destinationCountry

    const { error } = await supabase
      .from('profiles')
      .update({
        destination_country: finalDestinationCountry,
        destination_city: destinationCity.trim() || null,
        location_sharing_enabled: locationSharingEnabled,
        onboarding_step: 6,
        onboarding_completed: true,
      })
      .eq('id', profile.id)

    setLoading(false)

    if (error) {
      setErrorMessage('Er ging iets mis bij het afronden van je profiel.')
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-background">
      <Image
        src="/images/wave.png"
        alt=""
        className="absolute left-0 top-0 h-auto w-full max-w-3xl"
        width={500}
        height={300}
        priority
      />

      <div className="relative z-10 mx-auto flex min-h-dvh max-w-md flex-col px-fluid-main pb-10 pt-16">
        <button
          type="button"
          onClick={() => router.push('/onboarding/emergency-contact')}
          aria-label="Ga terug"
          className="mb-16 flex h-8 w-8 items-center justify-center text-foreground"
        >
          <ArrowIcon className="h-4 w-5" />
        </button>

        <section>
          <h1 className="text-[30px] font-black text-primary">Welkom</h1>
          <p className="mt-3 text-[30px] leading-tight text-foreground">Selecteer je reis</p>
          <p className="mt-4 text-sm leading-6 text-dark-gray">
            Kies je bestemming, zodat AllergyBuddy communicatie, restaurants en noodinformatie
            beter kan afstemmen op je reis.
          </p>
        </section>

        <section className="mt-10 space-y-5">
          <div>
            <p className="mb-3 text-sm font-bold text-foreground">Reisland</p>

            <div className="space-y-3">
              {countryOptions.map((country) => {
                const isSelected = destinationCountry === country.code

                return (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => setDestinationCountry(country.code)}
                    className={[
                      'flex min-h-14.5 w-full items-center justify-between rounded-xl border px-4 text-left transition-all duration-200',
                      isSelected
                        ? 'border-transparent bg-linear-to-r from-foreground to-primary text-white'
                        : 'border-foreground/20 bg-white text-foreground hover:border-primary/50',
                    ].join(' ')}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-xl">{country.flag}</span>
                      <span className="text-sm font-bold">{country.label}</span>
                    </span>

                    <span
                      className={[
                        'flex h-5 w-5 items-center justify-center rounded-full border',
                        isSelected ? 'border-white bg-white' : 'border-foreground/50 bg-white',
                      ].join(' ')}
                    >
                      {isSelected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                    </span>
                  </button>
                )
              })}
            </div>

            {selectedCountry && selectedCountry.code !== 'OTHER' && (
              <p className="mt-3 text-xs font-bold text-dark-gray">
                Geselecteerd: {selectedCountry.flag} {selectedCountry.label} ({selectedCountry.code})
              </p>
            )}
          </div>

          {destinationCountry === 'OTHER' && (
            <div>
              <label
                htmlFor="customCountry"
                className="mb-2 block text-sm font-bold text-foreground"
              >
                Welk land?
              </label>
              <input
                id="customCountry"
                type="text"
                value={customCountry}
                onChange={(event) => setCustomCountry(event.target.value)}
                placeholder="Bijvoorbeeld: Portugal"
                className="h-14.5 w-full rounded-xl border border-foreground/20 bg-white px-4 text-sm font-medium text-foreground outline-none placeholder:text-dark-gray/60 focus:border-primary"
              />
              <p className="mt-2 text-xs leading-5 text-dark-gray">
                Let op: voor landen buiten de vaste lijst kan AllergyBuddy terugvallen op Engels en
                algemene noodinformatie.
              </p>
            </div>
          )}

          <div>
            <label
              htmlFor="destinationCity"
              className="mb-2 block text-sm font-bold text-foreground"
            >
              Stad of regio
            </label>
            <input
              id="destinationCity"
              type="text"
              value={destinationCity}
              onChange={(event) => setDestinationCity(event.target.value)}
              placeholder="Bijvoorbeeld: Istanbul, Antalya of Alanya"
              className="h-14.5 w-full rounded-xl border border-foreground/20 bg-white px-4 text-sm font-medium text-foreground outline-none placeholder:text-dark-gray/60 focus:border-primary"
            />
          </div>

          <button
            type="button"
            onClick={handleRequestLocation}
            className={[
              'flex w-full items-start justify-between gap-4 rounded-xl border px-4 py-4 text-left transition-all duration-200',
              locationSharingEnabled
                ? 'border-transparent bg-linear-to-r from-foreground to-primary text-white'
                : 'border-foreground/20 bg-white text-foreground hover:border-primary/50',
            ].join(' ')}
          >
            <span>
              <span className="block text-sm font-black">
                {locationLoading ? 'Locatie ophalen...' : 'Locatie delen'}
              </span>
              <span
                className={[
                  'mt-1 block text-xs leading-5',
                  locationSharingEnabled ? 'text-white/80' : 'text-dark-gray',
                ].join(' ')}
              >
                Hiermee kunnen we restaurants en noodinformatie beter afstemmen op waar je bent.
              </span>
            </span>

            <span
              className={[
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
                locationSharingEnabled ? 'border-white bg-white' : 'border-foreground/40 bg-white',
              ].join(' ')}
            >
              {locationSharingEnabled && <span className="h-3 w-3 rounded-full bg-primary" />}
            </span>
          </button>

          {locationSharingEnabled && (
            <button
              type="button"
              onClick={() => setLocationSharingEnabled(false)}
              className="text-sm font-black text-red"
            >
              Locatie delen uitzetten
            </button>
          )}

          <div className="rounded-xl bg-amber/15 px-4 py-3 text-xs font-medium leading-5 text-foreground">
            AllergyBuddy gebruikt je bestemming alleen om informatie relevanter te maken. De app
            geeft nooit garantie dat eten veilig is.
          </div>
        </section>

        {errorMessage && (
          <div className="mt-6 rounded-xl bg-red/10 px-4 py-3 text-sm font-bold text-red">
            {errorMessage}
          </div>
        )}

        <div className="mt-auto pt-10">
          <OnboardingProgress currentStep={CURRENT_STEP} totalSteps={TOTAL_STEPS} />

          <Button
            type="button"
            variant="primary"
            fullWidth
            disabled={!canContinue || loading}
            onClick={handleFinish}
            className="mt-6"
          >
            {loading ? 'Afronden...' : 'Profiel voltooien'}
          </Button>
        </div>
      </div>
    </main>
  )
}

function normalizeCountryCode(value: string | null) {
  if (!value) return 'TR'

  const normalizedValue = value.trim().toUpperCase()

  const aliases: Record<string, string> = {
    TURKIJE: 'TR',
    TURKEY: 'TR',
    TÜRKIYE: 'TR',
    TR: 'TR',

    NEDERLAND: 'NL',
    NETHERLANDS: 'NL',
    HOLLAND: 'NL',
    NL: 'NL',

    THAILAND: 'TH',
    TH: 'TH',

    SPANJE: 'ES',
    SPAIN: 'ES',
    ESPAÑA: 'ES',
    ES: 'ES',

    ITALIË: 'IT',
    ITALIE: 'IT',
    ITALY: 'IT',
    IT: 'IT',

    FRANKRIJK: 'FR',
    FRANCE: 'FR',
    FR: 'FR',

    DUITSLAND: 'DE',
    GERMANY: 'DE',
    DEUTSCHLAND: 'DE',
    DE: 'DE',

    VERENIGD_KONINKRIJK: 'GB',
    'VERENIGD KONINKRIJK': 'GB',
    UNITED_KINGDOM: 'GB',
    'UNITED KINGDOM': 'GB',
    UK: 'GB',
    GB: 'GB',

    VERENIGDE_STATEN: 'US',
    'VERENIGDE STATEN': 'US',
    UNITED_STATES: 'US',
    'UNITED STATES': 'US',
    USA: 'US',
    US: 'US',

    MAROKKO: 'MA',
    MOROCCO: 'MA',
    MA: 'MA',

    'VERENIGDE ARABISCHE EMIRATEN': 'AE',
    UNITED_ARAB_EMIRATES: 'AE',
    'UNITED ARAB EMIRATES': 'AE',
    UAE: 'AE',
    AE: 'AE',
  }

  const countryCode = aliases[normalizedValue] ?? normalizedValue

  const existsInOptions = countryOptions.some((country) => country.code === countryCode)

  return existsInOptions ? countryCode : 'OTHER'
}

function OnboardingProgress({
  currentStep,
  totalSteps,
}: {
  currentStep: number
  totalSteps: number
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isActive = index === currentStep

        return (
          <span
            key={index}
            className={[
              'block h-3 rounded-full border border-foreground transition-all duration-200',
              isActive ? 'w-8 bg-foreground' : 'w-3 bg-transparent',
            ].join(' ')}
            aria-hidden="true"
          />
        )
      })}
    </div>
  )
}