'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import ArrowIcon from '@/components/icons/ArrowIcon'
import { createClient } from '@/lib/supabase/client'

type Severity = 'mild' | 'moderate' | 'severe' | 'anaphylaxis_risk' | 'unknown'

type ProfileAllergen = {
  id: string
  profile_id: string
  allergen_id: string
  severity: Severity | null
  causes_anaphylaxis: boolean | null
  cross_contamination_sensitive: boolean | null
  reaction_description: string | null
  user_notes: string | null
  allergen_name_nl: string
  allergen_name_en: string | null
  allergen_name_tr: string | null
  allergen_slug: string
  allergen_icon_url: string | null
}

type SeverityStepProps = {
  profile: {
    id: string
    onboarding_step: number | null
    onboarding_completed: boolean | null
  }
  profileAllergens: ProfileAllergen[]
}

type FormState = Record<
  string,
  {
    severity: Severity
    causes_anaphylaxis: boolean
    cross_contamination_sensitive: boolean
  }
>

const CURRENT_STEP = 2
const TOTAL_STEPS = 6

const severityOptions: {
  value: Severity
  label: string
}[] = [
  {
    value: 'mild',
    label: 'Mild',
  },
  {
    value: 'moderate',
    label: 'Gemiddeld',
  },
  {
    value: 'severe',
    label: 'Ernstig',
  },
  {
    value: 'anaphylaxis_risk',
    label: 'Anafylaxie risico',
  },
  {
    value: 'unknown',
    label: 'Weet ik niet',
  },
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

function getHighestSeverity(values: FormState): Severity {
  const severityRank: Record<Severity, number> = {
    unknown: 0,
    mild: 1,
    moderate: 2,
    severe: 3,
    anaphylaxis_risk: 4,
  }

  return Object.values(values).reduce<Severity>((highest, item) => {
    return severityRank[item.severity] > severityRank[highest] ? item.severity : highest
  }, 'unknown')
}

function hasAnyAnaphylaxisRisk(values: FormState) {
  return Object.values(values).some((item) => item.causes_anaphylaxis)
}

function hasAnyCrossContaminationSensitivity(values: FormState) {
  return Object.values(values).some((item) => item.cross_contamination_sensitive)
}

export default function SeverityStep({ profile, profileAllergens }: SeverityStepProps) {
  const router = useRouter()
  const supabase = createClient()

  const [formState, setFormState] = useState<FormState>(() => {
    return profileAllergens.reduce<FormState>((acc, item) => {
      acc[item.id] = {
        severity: item.severity ?? 'unknown',
        causes_anaphylaxis: item.causes_anaphylaxis ?? false,
        cross_contamination_sensitive: item.cross_contamination_sensitive ?? false,
      }

      return acc
    }, {})
  })

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function updateSeverity(profileAllergenId: string, severity: Severity) {
    setFormState((current) => ({
      ...current,
      [profileAllergenId]: {
        ...current[profileAllergenId],
        severity,
        causes_anaphylaxis:
          severity === 'anaphylaxis_risk'
            ? true
            : current[profileAllergenId].causes_anaphylaxis,
      },
    }))
  }

  function toggleBoolean(
    profileAllergenId: string,
    key: 'causes_anaphylaxis' | 'cross_contamination_sensitive'
  ) {
    setFormState((current) => ({
      ...current,
      [profileAllergenId]: {
        ...current[profileAllergenId],
        [key]: !current[profileAllergenId][key],
      },
    }))
  }

  async function handleNext() {
    setLoading(true)
    setErrorMessage(null)

    const updates = Object.entries(formState).map(([profileAllergenId, values]) => {
      return supabase
        .from('profile_allergens')
        .update({
          severity: values.severity,
          causes_anaphylaxis: values.causes_anaphylaxis,
          cross_contamination_sensitive: values.cross_contamination_sensitive,
        })
        .eq('id', profileAllergenId)
        .eq('profile_id', profile.id)
    })

    const results = await Promise.all(updates)
    const hasProfileAllergenError = results.some((result) => result.error)

    if (hasProfileAllergenError) {
      setLoading(false)
      setErrorMessage('Er ging iets mis bij het opslaan van je allergiegegevens.')
      return
    }

    const highestSeverity = getHighestSeverity(formState)
    const hasAnaphylaxisRisk = hasAnyAnaphylaxisRisk(formState)
    const hasCrossContaminationSensitivity = hasAnyCrossContaminationSensitivity(formState)

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        has_food_allergy: true,
        allergy_severity: highestSeverity,
        anaphylaxis_risk: hasAnaphylaxisRisk,
        cross_contamination_sensitive: hasCrossContaminationSensitivity,
        onboarding_step: 3,
      })
      .eq('id', profile.id)

    setLoading(false)

    if (profileError) {
      setErrorMessage(
        'Je allergiegegevens zijn opgeslagen, maar je profielsamenvatting kon niet worden bijgewerkt.'
      )
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
        className="absolute left-0 top-0 h-auto w-full max-w-3xl"
        width={500}
        height={300}
        priority
      />

      <div className="relative z-10 mx-auto flex min-h-dvh max-w-md flex-col px-fluid-main pb-10 pt-16">
        <button
          type="button"
          onClick={() => router.push('/onboarding/allergies')}
          aria-label="Ga terug"
          className="mb-16 flex h-8 w-8 items-center justify-center text-foreground"
        >
          <ArrowIcon className="h-4 w-5" />
        </button>

        <section>
          <h1 className="text-[30px] font-black text-primary">Welkom</h1>
          <p className="mt-3 text-[30px] leading-tight text-foreground">
            Mate van allergie
          </p>
          <p className="mt-4 text-sm leading-6 text-dark-gray">
            Geef per allergie aan hoe ernstig deze is en of kruisbesmetting of anafylaxie
            een risico is.
          </p>
        </section>

        <section className="mt-10 space-y-5">
          {profileAllergens.map((item) => {
            const values = formState[item.id]

            if (!values) return null

            return (
              <article
                key={item.id}
                className="rounded-2xl border border-foreground/15 bg-white p-4"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-foreground text-white">
                    {item.allergen_icon_url ? (
                      <Image
                        src={item.allergen_icon_url}
                        alt=""
                        width={22}
                        height={22}
                        className="h-5.5 w-5.5 object-contain"
                      />
                    ) : (
                      <span className="text-xl leading-none">
                        {fallbackIcons[item.allergen_slug] ?? '•'}
                      </span>
                    )}
                  </div>

                  <div>
                    <h2 className="text-base font-black text-foreground">
                      {item.allergen_name_nl}
                    </h2>
                    <p className="text-xs font-medium text-dark-gray">
                      Vul de details voor deze allergie in
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-sm font-bold text-foreground">Ernst</p>

                  <div className="grid grid-cols-2 gap-2">
                    {severityOptions.map((option) => {
                      const isSelected = values.severity === option.value

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateSeverity(item.id, option.value)}
                          className={[
                            'min-h-11 rounded-xl border px-3 text-sm font-bold transition-all duration-200',
                            isSelected
                              ? 'border-transparent bg-linear-to-r from-foreground to-primary text-white'
                              : 'border-foreground/20 bg-white text-foreground hover:border-primary/50',
                          ].join(' ')}
                        >
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <ToggleRow
                    label="Gevoelig voor kruisbesmetting"
                    checked={values.cross_contamination_sensitive}
                    onClick={() => toggleBoolean(item.id, 'cross_contamination_sensitive')}
                  />

                  <ToggleRow
                    label="Risico op anafylactische reactie"
                    checked={values.causes_anaphylaxis}
                    onClick={() => toggleBoolean(item.id, 'causes_anaphylaxis')}
                  />
                </div>
              </article>
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
            disabled={loading}
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

function ToggleRow({
  label,
  checked,
  onClick,
}: {
  label: string
  checked: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-12 w-full items-center justify-between rounded-xl border border-foreground/15 bg-white px-4 text-left"
    >
      <span className="text-sm font-bold text-foreground">{label}</span>

      <span
        className={[
          'flex h-7 w-12 items-center rounded-full p-1 transition-colors duration-200',
          checked ? 'bg-primary' : 'bg-foreground/15',
        ].join(' ')}
      >
        <span
          className={[
            'block h-5 w-5 rounded-full bg-white transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0',
          ].join(' ')}
        />
      </span>
    </button>
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