'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import type {
  AccountEditAllergen,
  AccountEditProfileAllergen,
} from '@/app/account/allergies/edit/page'

type Severity = 'mild' | 'moderate' | 'severe' | 'anaphylaxis_risk' | 'unknown'

type FormState = Record<
  string,
  {
    selected: boolean
    profileAllergenId: string | null
    severity: Severity
    causes_anaphylaxis: boolean
    cross_contamination_sensitive: boolean
    user_notes: string
    reaction_description: string
  }
>

const severityOptions: {
  value: Severity
  label: string
}[] = [
  { value: 'unknown', label: 'Onbekend' },
  { value: 'mild', label: 'Mild' },
  { value: 'moderate', label: 'Gemiddeld' },
  { value: 'severe', label: 'Ernstig' },
  { value: 'anaphylaxis_risk', label: 'Anafylaxie' },
]

export default function AccountAllergiesEditPage({
  profileId,
  allergens,
  profileAllergens,
}: {
  profileId: string
  allergens: AccountEditAllergen[]
  profileAllergens: AccountEditProfileAllergen[]
}) {
  const router = useRouter()
  const supabase = createClient()

  const initialState = useMemo<FormState>(() => {
    return allergens.reduce<FormState>((acc, allergen) => {
      const existing = profileAllergens.find((item) => item.allergen_id === allergen.id)

      acc[allergen.id] = {
        selected: Boolean(existing),
        profileAllergenId: existing?.id ?? null,
        severity: existing?.severity ?? 'unknown',
        causes_anaphylaxis: existing?.causes_anaphylaxis ?? false,
        cross_contamination_sensitive: existing?.cross_contamination_sensitive ?? false,
        user_notes: existing?.user_notes ?? '',
        reaction_description: existing?.reaction_description ?? '',
      }

      return acc
    }, {})
  }, [allergens, profileAllergens])

  const [formState, setFormState] = useState<FormState>(initialState)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const selectedCount = Object.values(formState).filter((item) => item.selected).length

  function updateAllergen(
    allergenId: string,
    values: Partial<FormState[string]>
  ) {
    setFormState((current) => ({
      ...current,
      [allergenId]: {
        ...current[allergenId],
        ...values,
      },
    }))
  }

  async function handleSave() {
    setSaving(true)
    setErrorMessage(null)

    const selectedEntries = Object.entries(formState).filter(([, value]) => value.selected)
    const unselectedEntries = Object.entries(formState).filter(
      ([, value]) => !value.selected && value.profileAllergenId
    )

    const deleteIds = unselectedEntries
      .map(([, value]) => value.profileAllergenId)
      .filter(Boolean) as string[]

    if (deleteIds.length > 0) {
      const { error } = await supabase
        .from('profile_allergens')
        .delete()
        .eq('profile_id', profileId)
        .in('id', deleteIds)

      if (error) {
        setSaving(false)
        setErrorMessage('Er ging iets mis bij het verwijderen van allergieën.')
        return
      }
    }

    for (const [allergenId, value] of selectedEntries) {
      const payload = {
        profile_id: profileId,
        allergen_id: allergenId,
        severity: value.severity,
        causes_anaphylaxis: value.causes_anaphylaxis,
        cross_contamination_sensitive: value.cross_contamination_sensitive,
        user_notes: value.user_notes.trim() || null,
        reaction_description: value.reaction_description.trim() || null,
      }

      if (value.profileAllergenId) {
        const { error } = await supabase
          .from('profile_allergens')
          .update(payload)
          .eq('id', value.profileAllergenId)
          .eq('profile_id', profileId)

        if (error) {
          setSaving(false)
          setErrorMessage('Er ging iets mis bij het opslaan van je allergieën.')
          return
        }
      } else {
        const { error } = await supabase.from('profile_allergens').insert(payload)

        if (error) {
          setSaving(false)
          setErrorMessage('Er ging iets mis bij het toevoegen van een allergie.')
          return
        }
      }
    }

    const highestSeverity = getHighestSeverity(formState)
    const hasAnyAllergy = selectedEntries.length > 0
    const hasAnaphylaxisRisk = selectedEntries.some(([, item]) => item.causes_anaphylaxis)
    const hasCrossContaminationSensitivity = selectedEntries.some(
      ([, item]) => item.cross_contamination_sensitive
    )

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        has_food_allergy: hasAnyAllergy,
        allergy_severity: highestSeverity,
        anaphylaxis_risk: hasAnaphylaxisRisk,
        cross_contamination_sensitive: hasCrossContaminationSensitivity,
      })
      .eq('id', profileId)

    setSaving(false)

    if (profileError) {
      setErrorMessage(
        'Je allergieën zijn opgeslagen, maar je profielsamenvatting kon niet worden bijgewerkt.'
      )
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
            Allergieën aanpassen
          </h1>
          <p className="mt-4 text-sm leading-6 text-dark-gray">
            Selecteer je allergieën en pas per allergie de ernst, anafylaxie en kruisbesmetting aan.
          </p>
        </section>

        <section className="mt-6 rounded-2xl bg-foreground/5 px-4 py-3">
          <p className="text-sm font-black text-foreground">
            {selectedCount} allergie{selectedCount === 1 ? '' : 'ën'} geselecteerd
          </p>
        </section>

        <section className="mt-6 space-y-4">
          {allergens.map((allergen) => {
            const state = formState[allergen.id]
            if (!state) return null

            return (
              <article
                key={allergen.id}
                className={[
                  'rounded-2xl border bg-white p-4',
                  state.selected ? 'border-primary/40' : 'border-foreground/15',
                ].join(' ')}
              >
                <button
                  type="button"
                  onClick={() =>
                    updateAllergen(allergen.id, {
                      selected: !state.selected,
                    })
                  }
                  className="flex w-full items-center justify-between gap-4 text-left"
                >
                  <div>
                    <h2 className="text-base font-black text-foreground">{allergen.name_nl}</h2>
                    <p className="mt-1 text-sm font-medium text-dark-gray">
                      {allergen.name_en}
                      {allergen.name_tr ? ` · ${allergen.name_tr}` : ''}
                    </p>
                  </div>

                  <span
                    className={[
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
                      state.selected
                        ? 'border-primary bg-primary'
                        : 'border-foreground/30 bg-white',
                    ].join(' ')}
                  >
                    {state.selected && <span className="h-2.5 w-2.5 rounded-full bg-white" />}
                  </span>
                </button>

                {state.selected && (
                  <div className="mt-5 space-y-5">
                    <div>
                      <p className="mb-3 text-sm font-black text-foreground">Ernst</p>

                      <div className="grid grid-cols-2 gap-2">
                        {severityOptions.map((option) => {
                          const isActive = state.severity === option.value

                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() =>
                                updateAllergen(allergen.id, {
                                  severity: option.value,
                                  causes_anaphylaxis:
                                    option.value === 'anaphylaxis_risk'
                                      ? true
                                      : state.causes_anaphylaxis,
                                })
                              }
                              className={[
                                'min-h-11 rounded-xl border px-3 text-sm font-black transition-all',
                                isActive
                                  ? 'border-transparent bg-linear-to-r from-foreground to-primary text-white'
                                  : 'border-foreground/20 bg-white text-foreground',
                              ].join(' ')}
                            >
                              {option.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <ToggleRow
                      label="Risico op anafylaxie"
                      checked={state.causes_anaphylaxis}
                      onClick={() =>
                        updateAllergen(allergen.id, {
                          causes_anaphylaxis: !state.causes_anaphylaxis,
                        })
                      }
                    />

                    <ToggleRow
                      label="Gevoelig voor kruisbesmetting"
                      checked={state.cross_contamination_sensitive}
                      onClick={() =>
                        updateAllergen(allergen.id, {
                          cross_contamination_sensitive:
                            !state.cross_contamination_sensitive,
                        })
                      }
                    />

                    <Textarea
                      label="Reactie / symptomen"
                      value={state.reaction_description}
                      onChange={(value) =>
                        updateAllergen(allergen.id, {
                          reaction_description: value,
                        })
                      }
                      placeholder="Bijvoorbeeld: zwelling, benauwdheid, buikpijn..."
                    />

                    <Textarea
                      label="Notities"
                      value={state.user_notes}
                      onChange={(value) =>
                        updateAllergen(allergen.id, {
                          user_notes: value,
                        })
                      }
                      placeholder="Bijvoorbeeld: vooral opletten bij sauzen of desserts"
                    />
                  </div>
                )}
              </article>
            )
          })}
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

function Textarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black text-foreground">{label}</label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-24 w-full resize-none rounded-xl border border-foreground/20 bg-white px-4 py-3 text-sm font-medium text-foreground outline-none placeholder:text-dark-gray/60 focus:border-primary"
      />
    </div>
  )
}

function getHighestSeverity(formState: FormState): Severity {
  const severityRank: Record<Severity, number> = {
    unknown: 0,
    mild: 1,
    moderate: 2,
    severe: 3,
    anaphylaxis_risk: 4,
  }

  const selectedItems = Object.values(formState).filter((item) => item.selected)

  if (selectedItems.length === 0) {
    return 'unknown'
  }

  return selectedItems.reduce<Severity>((highest, item) => {
    return severityRank[item.severity] > severityRank[highest] ? item.severity : highest
  }, 'unknown')
}