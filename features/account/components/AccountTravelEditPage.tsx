'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import type { AccountTravelEditProfile } from '@/app/account/travel/edit/page'

type CountryOption = {
  code: string
  nameNl: string
  nameEn: string
  flag: string
}

const fallbackCountries: CountryOption[] = [
  { code: 'TR', nameNl: 'Turkije', nameEn: 'Turkey', flag: '🇹🇷' },
  { code: 'NL', nameNl: 'Nederland', nameEn: 'Netherlands', flag: '🇳🇱' },
  { code: 'BE', nameNl: 'België', nameEn: 'Belgium', flag: '🇧🇪' },
  { code: 'DE', nameNl: 'Duitsland', nameEn: 'Germany', flag: '🇩🇪' },
  { code: 'FR', nameNl: 'Frankrijk', nameEn: 'France', flag: '🇫🇷' },
  { code: 'ES', nameNl: 'Spanje', nameEn: 'Spain', flag: '🇪🇸' },
  { code: 'IT', nameNl: 'Italië', nameEn: 'Italy', flag: '🇮🇹' },
  { code: 'GB', nameNl: 'Verenigd Koninkrijk', nameEn: 'United Kingdom', flag: '🇬🇧' },
  { code: 'US', nameNl: 'Verenigde Staten', nameEn: 'United States', flag: '🇺🇸' },
  { code: 'MA', nameNl: 'Marokko', nameEn: 'Morocco', flag: '🇲🇦' },
  { code: 'AE', nameNl: 'Verenigde Arabische Emiraten', nameEn: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'TH', nameNl: 'Thailand', nameEn: 'Thailand', flag: '🇹🇭' },
]

export default function AccountTravelEditPage({
  profile,
}: {
  profile: AccountTravelEditProfile
}) {
  const router = useRouter()
  const supabase = createClient()

  const [countrySearch, setCountrySearch] = useState('')
  const [destinationCountry, setDestinationCountry] = useState(profile.destination_country ?? 'NL')
  const [destinationCity, setDestinationCity] = useState(profile.destination_city ?? '')
  const [locationSharingEnabled, setLocationSharingEnabled] = useState(
    profile.location_sharing_enabled ?? false
  )

  const [saving, setSaving] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const filteredCountries = useMemo(() => {
    const query = countrySearch.trim().toLowerCase()

    if (!query) return fallbackCountries

    return fallbackCountries.filter((country) => {
      return (
        country.code.toLowerCase().includes(query) ||
        country.nameNl.toLowerCase().includes(query) ||
        country.nameEn.toLowerCase().includes(query)
      )
    })
  }, [countrySearch])

  const selectedCountry = fallbackCountries.find((country) => country.code === destinationCountry)

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

  async function handleSave() {
    setSaving(true)
    setErrorMessage(null)

    const { error } = await supabase
      .from('profiles')
      .update({
        destination_country: destinationCountry,
        destination_city: destinationCity.trim() || null,
        location_sharing_enabled: locationSharingEnabled,
      })
      .eq('id', profile.id)

    setSaving(false)

    if (error) {
      console.error(error)
      setErrorMessage('Er ging iets mis bij het opslaan van je reisinstellingen.')
      return
    }

    router.push('/account')
    router.refresh()
  }

  return (
    <main className="min-h-dvh bg-background px-fluid-main pb-10 pt-10">
      <div className="mx-auto max-w-md">
        <Link href="/account" className="text-sm font-black text-primary">
          ← Terug naar account
        </Link>

        <section className="mt-8">
          <p className="text-sm font-black text-primary">Account</p>
          <h1 className="mt-2 text-[32px] font-black leading-tight text-foreground">
            Reis & locatie
          </h1>
          <p className="mt-4 text-sm leading-6 text-dark-gray">
            Pas je bestemming en locatie-instellingen aan. Dit bepaalt waar de kaart en restaurants
            op focussen.
          </p>
        </section>

        <section className="mt-6">
          <label className="mb-2 block text-sm font-black text-foreground">Reisland</label>

          <input
            type="search"
            value={countrySearch}
            onChange={(event) => setCountrySearch(event.target.value)}
            placeholder="Zoek een land..."
            className="mb-3 h-12 w-full rounded-xl border border-foreground/20 bg-white px-4 text-sm font-medium text-foreground outline-none placeholder:text-dark-gray/60 focus:border-primary"
          />

          <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
            {filteredCountries.map((country) => {
              const isSelected = destinationCountry === country.code

              return (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => setDestinationCountry(country.code)}
                  className={[
                    'flex min-h-14 w-full items-center justify-between rounded-xl border px-4 text-left transition-all',
                    isSelected
                      ? 'border-transparent bg-linear-to-r from-foreground to-primary text-white'
                      : 'border-foreground/20 bg-white text-foreground',
                  ].join(' ')}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-xl">{country.flag}</span>
                    <span className="text-sm font-black">{country.nameNl}</span>
                  </span>

                  <span
                    className={[
                      'flex h-5 w-5 items-center justify-center rounded-full border',
                      isSelected ? 'border-white bg-white' : 'border-foreground/40 bg-white',
                    ].join(' ')}
                  >
                    {isSelected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                  </span>
                </button>
              )
            })}
          </div>

          {selectedCountry && (
            <p className="mt-3 text-xs font-bold text-dark-gray">
              Geselecteerd: {selectedCountry.flag} {selectedCountry.nameNl} ({selectedCountry.code})
            </p>
          )}
        </section>

        <section className="mt-6">
          <label className="mb-2 block text-sm font-black text-foreground">Stad of regio</label>

          <input
            type="text"
            value={destinationCity}
            onChange={(event) => setDestinationCity(event.target.value)}
            placeholder="Bijvoorbeeld: Antalya, Almere of Amsterdam"
            className="h-14 w-full rounded-xl border border-foreground/20 bg-white px-4 text-sm font-medium text-foreground outline-none placeholder:text-dark-gray/60 focus:border-primary"
          />
        </section>

        <section className="mt-6">
          <button
            type="button"
            onClick={handleRequestLocation}
            className={[
              'flex w-full items-start justify-between gap-4 rounded-2xl border px-4 py-4 text-left transition-all',
              locationSharingEnabled
                ? 'border-transparent bg-linear-to-r from-foreground to-primary text-white'
                : 'border-foreground/20 bg-white text-foreground',
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
                Hiermee kunnen restaurants en afstanden beter afgestemd worden op waar je bent.
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
              className="mt-3 text-sm font-black text-red"
            >
              Locatie delen uitzetten
            </button>
          )}
        </section>

        <section className="mt-6 rounded-2xl bg-amber/15 px-4 py-4">
          <p className="text-sm font-black text-foreground">Let op</p>
          <p className="mt-2 text-sm leading-6 text-foreground/80">
            AllergyBuddy gebruikt je bestemming en locatie alleen om restaurants en noodinformatie
            relevanter te maken. Dit is geen garantie dat eten veilig is.
          </p>
        </section>

        {errorMessage && (
          <div className="mt-6 rounded-xl bg-red/10 px-4 py-3 text-sm font-bold text-red">
            {errorMessage}
          </div>
        )}

        <div className="sticky bottom-0 -mx-fluid-main mt-8 bg-background/95 px-fluid-main py-4 backdrop-blur">
          <Button type="button" variant="primary" fullWidth disabled={saving} onClick={handleSave}>
            {saving ? 'Opslaan...' : 'Wijzigingen opslaan'}
          </Button>
        </div>
      </div>
    </main>
  )
}