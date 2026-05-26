'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import ArrowIcon from '@/components/icons/ArrowIcon'
import { createClient } from '@/lib/supabase/client'

type Allergen = {
  id: string
  name_nl: string
  name_en: string | null
  name_tr: string | null
  slug: string
  icon_url: string | null
}

type AllergiesStepProps = {
  profile: {
    id: string
    onboarding_step: number | null
    onboarding_completed: boolean | null
  }
  allergens: Allergen[]
  selectedAllergenIds: string[]
}

const CURRENT_STEP = 1
const TOTAL_STEPS = 6

const allergenOrder = [
  'noten',
  'pinda',
  'vis',
  'gluten',
  'ei',
  'melk',
  'schaaldieren',
  'soja',
  'sesam',
  'lupine',
  'selderij',
]

const fallbackIcons: Record<string, string> = {
  noten: '🌰',
  pinda: '🥜',
  vis: '🐟',
  gluten: '🌾',
  ei: '🥚',
  melk: '🥛',
  schaaldieren: '🦐',
  soja: '🫘',
  sesam: '💧',
  lupine: '🌿',
  selderij: '🥬',
}

export default function AllergiesStep({
  profile,
  allergens,
  selectedAllergenIds,
}: AllergiesStepProps) {
  const router = useRouter()
  const supabase = createClient()

  const sortedAllergens = useMemo(() => {
    return [...allergens].sort((a, b) => {
      const indexA = allergenOrder.indexOf(a.slug)
      const indexB = allergenOrder.indexOf(b.slug)

      if (indexA === -1 && indexB === -1) return a.name_nl.localeCompare(b.name_nl)
      if (indexA === -1) return 1
      if (indexB === -1) return -1

      return indexA - indexB
    })
  }, [allergens])

  const [selectedIds, setSelectedIds] = useState<string[]>(selectedAllergenIds)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function toggleAllergen(allergenId: string) {
    setSelectedIds((current) => {
      if (current.includes(allergenId)) {
        return current.filter((id) => id !== allergenId)
      }

      return [...current, allergenId]
    })
  }

  async function handleNext() {
    if (!profile.id || selectedIds.length === 0) return

    setLoading(true)
    setErrorMessage(null)

    const { error: deleteError } = await supabase
      .from('profile_allergens')
      .delete()
      .eq('profile_id', profile.id)

    if (deleteError) {
      setLoading(false)
      setErrorMessage('Er ging iets mis bij het opslaan van je allergieën.')
      return
    }

    const profileAllergens = selectedIds.map((allergenId) => ({
      profile_id: profile.id,
      allergen_id: allergenId,
      severity: 'unknown',
      causes_anaphylaxis: false,
      cross_contamination_sensitive: false,
    }))

    const { error: insertError } = await supabase
      .from('profile_allergens')
      .insert(profileAllergens)

    if (insertError) {
      setLoading(false)
      setErrorMessage('Er ging iets mis bij het opslaan van je allergieën.')
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        onboarding_step: 2,
      })
      .eq('id', profile.id)

    setLoading(false)

    if (profileError) {
      setErrorMessage('Je allergieën zijn opgeslagen, maar de volgende stap kon niet worden bijgewerkt.')
      return
    }

    router.push('/onboarding')
    router.refresh()
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-background">
      <Image
        src="/images/wave.png"
        alt=""
        className="absolute left-0 top-0 h-auto w-full max-w-md md:left-1/2 md:-translate-x-1/2"
        width={500}
        height={300}
        priority
      />

      <div className="relative z-10 mx-auto flex min-h-dvh max-w-md flex-col px-fluid-main pb-10 pt-16">
        <button
          type="button"
          onClick={() => router.push('/onboarding/role')}
          aria-label="Ga terug"
          className="mb-16 flex h-8 w-8 items-center justify-center text-foreground"
        >
          <ArrowIcon className="h-4 w-5" />
        </button>

        <section>
          <h1 className="text-[30px] font-black text-primary">Welkom</h1>
          <p className="mt-3 text-[30px] leading-tight text-foreground">
            Selecteer allergieën
          </p>
        </section>

        <section className="mt-24 grid grid-cols-3 gap-3">
          {sortedAllergens.map((allergen) => {
            const isSelected = selectedIds.includes(allergen.id)

            return (
              <button
                key={allergen.id}
                type="button"
                onClick={() => toggleAllergen(allergen.id)}
                className={[
                  'flex min-h-11.5 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-bold transition-all duration-200',
                  isSelected
                    ? 'border-transparent bg-linear-to-r from-foreground to-primary text-white'
                    : 'border-foreground/30 bg-white text-foreground hover:border-primary/50',
                ].join(' ')}
              >
                {allergen.icon_url ? (
                  <Image
                    src={allergen.icon_url}
                    alt=""
                    width={18}
                    height={18}
                    className="h-4.5 w-4.5 object-contain"
                  />
                ) : (
                  <span className="text-base leading-none">
                    {fallbackIcons[allergen.slug] ?? '•'}
                  </span>
                )}

                <span className="truncate">
                  {allergen.slug === 'schaaldieren' ? 'Schaal...' : allergen.name_nl}
                </span>
              </button>
            )
          })}
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
            disabled={selectedIds.length === 0 || loading}
            onClick={handleNext}
            className="mt-6"
          >
            {loading ? 'Opslaan...' : 'Volgende'}
          </Button>
        </div>
      </div>
    </main>
  )
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