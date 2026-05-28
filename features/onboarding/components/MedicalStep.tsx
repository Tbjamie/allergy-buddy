'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import ArrowIcon from '@/components/icons/ArrowIcon'
import { createClient } from '@/lib/supabase/client'

type MedicalStepProps = {
  profile: {
    id: string
    onboarding_step: number | null
    onboarding_completed: boolean | null
    has_other_medical_conditions: boolean | null
    diabetes: boolean | null
    asthma: boolean | null
    heart_condition: boolean | null
    epilepsy: boolean | null
    medical_notes: string | null
    medication_notes: string | null
  }
}

const CURRENT_STEP = 3
const TOTAL_STEPS = 6

export default function MedicalStep({ profile }: MedicalStepProps) {
  const router = useRouter()
  const supabase = createClient()

  const [hasOtherMedicalConditions, setHasOtherMedicalConditions] = useState(
    profile.has_other_medical_conditions ?? false
  )
  const [diabetes, setDiabetes] = useState(profile.diabetes ?? false)
  const [asthma, setAsthma] = useState(profile.asthma ?? false)
  const [heartCondition, setHeartCondition] = useState(profile.heart_condition ?? false)
  const [epilepsy, setEpilepsy] = useState(profile.epilepsy ?? false)
  const [medicalNotes, setMedicalNotes] = useState(profile.medical_notes ?? '')
  const [medicationNotes, setMedicationNotes] = useState(profile.medication_notes ?? '')

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleNext() {
    setLoading(true)
    setErrorMessage(null)

    const hasAnyCondition =
      hasOtherMedicalConditions || diabetes || asthma || heartCondition || epilepsy

    const { error } = await supabase
      .from('profiles')
      .update({
        has_other_medical_conditions: hasAnyCondition,
        diabetes,
        asthma,
        heart_condition: heartCondition,
        epilepsy,
        medical_notes: medicalNotes.trim() || null,
        medication_notes: medicationNotes.trim() || null,
        onboarding_step: 4,
      })
      .eq('id', profile.id)

    setLoading(false)

    if (error) {
      setErrorMessage('Er ging iets mis bij het opslaan van je medische informatie.')
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
          onClick={() => router.push('/onboarding/severity')}
          aria-label="Ga terug"
          className="mb-16 flex h-8 w-8 items-center justify-center text-foreground"
        >
          <ArrowIcon className="h-4 w-5" />
        </button>

        <section>
          <h1 className="text-[30px] font-black text-primary">Welkom</h1>
          <p className="mt-3 text-[30px] leading-tight text-foreground">
            Medische informatie
          </p>
          <p className="mt-4 text-sm leading-6 text-dark-gray">
             Vul hier andere medische informatie in die belangrijk kan zijn voor hulpdiensten of
             omstanders.
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <ToggleCard
            title="Diabetes"
            description="Bijvoorbeeld diabetes type 1 of type 2."
            checked={diabetes}
            onClick={() => setDiabetes((current) => !current)}
          />

          <ToggleCard
            title="Astma"
            description="Kan invloed hebben op benauwdheid of ademhaling."
            checked={asthma}
            onClick={() => setAsthma((current) => !current)}
          />

          <ToggleCard
            title="Hartproblemen"
            description="Relevante informatie voor hulpdiensten of omstanders."
            checked={heartCondition}
            onClick={() => setHeartCondition((current) => !current)}
          />

          <ToggleCard
            title="Epilepsie"
            description="Kan belangrijk zijn bij een noodsituatie."
            checked={epilepsy}
            onClick={() => setEpilepsy((current) => !current)}
          />

          <ToggleCard
            title="Andere medische informatie"
            description="Bijvoorbeeld aandoeningen, beperkingen of belangrijke aandachtspunten."
            checked={hasOtherMedicalConditions}
            onClick={() => setHasOtherMedicalConditions((current) => !current)}
          />
        </section>

        <section className="mt-6 space-y-5">
          <div>
            <label htmlFor="medicalNotes" className="mb-2 block text-sm font-bold text-foreground">
              Extra medische informatie
            </label>
            <textarea
              id="medicalNotes"
              value={medicalNotes}
              onChange={(event) => setMedicalNotes(event.target.value)}
              placeholder="Bijvoorbeeld: Ik heb diabetes type 1 en draag meestal glucose bij me."
              className="min-h-28 w-full resize-none rounded-xl border border-foreground/20 bg-white px-4 py-3 text-sm font-medium text-foreground outline-none placeholder:text-dark-gray/60 focus:border-primary"
            />
          </div>

          <div>
            <label
              htmlFor="medicationNotes"
              className="mb-2 block text-sm font-bold text-foreground"
            >
              Medicatie of belangrijke hulpmiddelen
            </label>
            <textarea
              id="medicationNotes"
              value={medicationNotes}
              onChange={(event) => setMedicationNotes(event.target.value)}
              placeholder="Bijvoorbeeld: EpiPen in rugtas, antihistamine in jaszak, insuline in etui."
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

function ToggleCard({
  title,
  description,
  checked,
  onClick,
}: {
  title: string
  description: string
  checked: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-4 text-left transition-all duration-200',
        checked
          ? 'border-transparent bg-linear-to-r from-foreground to-primary text-white'
          : 'border-foreground/20 bg-white text-foreground hover:border-primary/50',
      ].join(' ')}
    >
      <span>
        <span className="block text-sm font-black">{title}</span>
        <span className={['mt-1 block text-xs leading-5', checked ? 'text-white/80' : 'text-dark-gray'].join(' ')}>
          {description}
        </span>
      </span>

      <span
        className={[
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
          checked ? 'border-white bg-white' : 'border-foreground/40 bg-white',
        ].join(' ')}
      >
        {checked && <span className="h-3 w-3 rounded-full bg-primary" />}
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