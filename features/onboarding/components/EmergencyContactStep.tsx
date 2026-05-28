'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import ArrowIcon from '@/components/icons/ArrowIcon'
import { createClient } from '@/lib/supabase/client'

type EmergencyContactRelation =
  | 'parent'
  | 'partner'
  | 'friend'
  | 'sibling'
  | 'travel_companion'
  | 'doctor'
  | 'other'

type EmergencyContactStepProps = {
  profile: {
    id: string
    onboarding_step: number | null
    onboarding_completed: boolean | null
    emergency_contact_name: string | null
    emergency_contact_phone: string | null
    emergency_contact_relation: EmergencyContactRelation | null
    emergency_contact_relation_custom: string | null
    emergency_contact_language: string | null
    emergency_contact_note: string | null
  }
}

const CURRENT_STEP = 4
const TOTAL_STEPS = 6

const relationOptions: {
  value: EmergencyContactRelation
  label: string
}[] = [
  {
    value: 'parent',
    label: 'Ouder',
  },
  {
    value: 'partner',
    label: 'Partner',
  },
  {
    value: 'friend',
    label: 'Vriend(in)',
  },
  {
    value: 'sibling',
    label: 'Broer / zus',
  },
  {
    value: 'travel_companion',
    label: 'Reisgenoot',
  },
  {
    value: 'doctor',
    label: 'Arts',
  },
  {
    value: 'other',
    label: 'Anders',
  },
]

const languageOptions = [
  {
    value: 'nl',
    label: 'Nederlands',
  },
  {
    value: 'en',
    label: 'Engels',
  },
  {
    value: 'tr',
    label: 'Turks',
  },
  {
    value: 'ar',
    label: 'Arabisch',
  },
  {
    value: 'other',
    label: 'Anders',
  },
]

export default function EmergencyContactStep({ profile }: EmergencyContactStepProps) {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState(profile.emergency_contact_name ?? '')
  const [phone, setPhone] = useState(profile.emergency_contact_phone ?? '')
  const [relation, setRelation] = useState<EmergencyContactRelation | null>(
    profile.emergency_contact_relation ?? null
  )
  const [relationCustom, setRelationCustom] = useState(
    profile.emergency_contact_relation_custom ?? ''
  )
  const [languages, setLanguages] = useState<string[]>(() => {
  if (!profile.emergency_contact_language) return ['nl']

  return profile.emergency_contact_language
    .split(',')
    .map((language) => language.trim())
    .filter(Boolean)
})
  const [note, setNote] = useState(profile.emergency_contact_note ?? '')

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const canContinue = name.trim().length > 0 && phone.trim().length > 0 && relation

  function toggleLanguage(languageValue: string) {
  setLanguages((current) => {
    if (current.includes(languageValue)) {
      const nextLanguages = current.filter((item) => item !== languageValue)

      return nextLanguages.length > 0 ? nextLanguages : current
    }

    return [...current, languageValue]
  })
}

  async function handleNext() {
    if (!canContinue) return

    setLoading(true)
    setErrorMessage(null)

    const normalizedName = name.trim()
    const normalizedPhone = phone.trim()
    const normalizedRelationCustom = relationCustom.trim() || null
    const normalizedNote = note.trim() || null
    const normalizedLanguages = languages.join(',')

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        emergency_contact_name: normalizedName,
        emergency_contact_phone: normalizedPhone,
        emergency_contact_relation: relation,
        emergency_contact_relation_custom: relation === 'other' ? normalizedRelationCustom : null,
        emergency_contact_language: normalizedLanguages,
        emergency_contact_note: normalizedNote,
        onboarding_step: 5,
      })
      .eq('id', profile.id)

    if (profileError) {
      setLoading(false)
      setErrorMessage('Er ging iets mis bij het opslaan van je noodcontact.')
      return
    }

    const { data: existingContact } = await supabase
      .from('emergency_contacts')
      .select('id')
      .eq('profile_id', profile.id)
      .eq('priority', 1)
      .maybeSingle()

    if (existingContact?.id) {
      const { error: updateContactError } = await supabase
        .from('emergency_contacts')
        .update({
          name: normalizedName,
          phone: normalizedPhone,
          relation,
          relation_custom: relation === 'other' ? normalizedRelationCustom : null,
          language: normalizedLanguages,
          note: normalizedNote,
          can_be_called: true,
          priority: 1,
        })
        .eq('id', existingContact.id)
        .eq('profile_id', profile.id)

      if (updateContactError) {
        setLoading(false)
        setErrorMessage('Je profiel is opgeslagen, maar je noodcontact kon niet worden bijgewerkt.')
        return
      }
    } else {
      const { error: insertContactError } = await supabase.from('emergency_contacts').insert({
        profile_id: profile.id,
        name: normalizedName,
        phone: normalizedPhone,
        relation,
        relation_custom: relation === 'other' ? normalizedRelationCustom : null,
        language: normalizedLanguages,
        note: normalizedNote,
        can_be_called: true,
        priority: 1,
      })

      if (insertContactError) {
        setLoading(false)
        setErrorMessage('Je profiel is opgeslagen, maar je noodcontact kon niet worden aangemaakt.')
        return
      }
    }

    setLoading(false)

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
          onClick={() => router.push('/onboarding/medical')}
          aria-label="Ga terug"
          className="mb-16 flex h-8 w-8 items-center justify-center text-foreground"
        >
          <ArrowIcon className="h-4 w-5" />
        </button>

        <section>
          <h1 className="text-[30px] font-black text-primary">Welkom</h1>
          <p className="mt-3 text-[30px] leading-tight text-foreground">Noodcontact</p>
          <p className="mt-4 text-sm leading-6 text-dark-gray">
            Voeg iemand toe die gebeld kan worden in een noodsituatie. Deze relatie tonen we
            later duidelijk op de noodpagina.
          </p>
        </section>

        <section className="mt-10 space-y-5">
          <div>
            <label htmlFor="contactName" className="mb-2 block text-sm font-bold text-foreground">
              Naam noodcontact
            </label>
            <input
              id="contactName"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Bijvoorbeeld: Rob de Boer"
              className="h-14.5 w-full rounded-xl border border-foreground/20 bg-white px-4 text-sm font-medium text-foreground outline-none placeholder:text-dark-gray/60 focus:border-primary"
            />
          </div>

          <div>
            <label htmlFor="contactPhone" className="mb-2 block text-sm font-bold text-foreground">
              Telefoonnummer
            </label>
            <input
              id="contactPhone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+31 6 12 34 56 78"
              className="h-14.5 w-full rounded-xl border border-foreground/20 bg-white px-4 text-sm font-medium text-foreground outline-none placeholder:text-dark-gray/60 focus:border-primary"
            />
          </div>

          <div>
            <p className="mb-3 text-sm font-bold text-foreground">Relatie tot jou</p>

            <div className="grid grid-cols-2 gap-3">
              {relationOptions.map((option) => {
                const isSelected = relation === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRelation(option.value)}
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

          {relation === 'other' && (
            <div>
              <label
                htmlFor="relationCustom"
                className="mb-2 block text-sm font-bold text-foreground"
              >
                Welke relatie?
              </label>
              <input
                id="relationCustom"
                type="text"
                value={relationCustom}
                onChange={(event) => setRelationCustom(event.target.value)}
                placeholder="Bijvoorbeeld: collega, buur, mentor"
                className="h-14.5 w-full rounded-xl border border-foreground/20 bg-white px-4 text-sm font-medium text-foreground outline-none placeholder:text-dark-gray/60 focus:border-primary"
              />
            </div>
          )}

          <div>
            <p className="mb-3 text-sm font-bold text-foreground">Taal van noodcontact</p>

            <div className="grid grid-cols-2 gap-3">
              {languageOptions.map((option) => {
                const isSelected = languages.includes(option.value)

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleLanguage(option.value)}
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

          <div>
            <label htmlFor="contactNote" className="mb-2 block text-sm font-bold text-foreground">
              Extra notitie
            </label>
            <textarea
              id="contactNote"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Bijvoorbeeld: Deze persoon weet waar mijn EpiPen ligt."
              className="min-h-28 w-full resize-none rounded-xl border border-foreground/20 bg-white px-4 py-3 text-sm font-medium text-foreground outline-none placeholder:text-dark-gray/60 focus:border-primary"
            />
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