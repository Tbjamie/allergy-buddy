'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import ArrowIcon from '@/components/icons/ArrowIcon'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

type Role =
  | 'has_allergy'
  | 'travels_with_allergic_person'
  | 'lives_with_allergic_person'
  | 'other'

type RoleStepProps = {
  profile: {
    id: string
    role: Role | null
    onboarding_completed: boolean | null
  } | null
}

const CURRENT_STEP = 0
const TOTAL_STEPS = 6

const roles: {
  value: Role
  label: string
}[] = [
  {
    value: 'has_allergy',
    label: 'Ik heb een allergie',
  },
  {
    value: 'travels_with_allergic_person',
    label: 'Ik reis samen met iemand met een allergie',
  },
  {
    value: 'lives_with_allergic_person',
    label: 'Ik woon samen met iemand met een allergie',
  },
  {
    value: 'other',
    label: 'Geen van de bovenstaande',
  },
]

export default function RoleStep({ profile }: RoleStepProps) {
  const router = useRouter()
  const supabase = createClient()

  const [selectedRole, setSelectedRole] = useState<Role | null>(profile?.role ?? null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleNext() {
    if (!profile?.id || !selectedRole) return

    setLoading(true)
    setErrorMessage(null)

    const { error } = await supabase
      .from('profiles')
      .update({
        role: selectedRole,
        onboarding_step: 1,
      })
      .eq('id', profile.id)

    setLoading(false)

    if (error) {
      setErrorMessage('Er ging iets mis bij het opslaan van je keuze.')
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
          onClick={() => router.push('/')}
          aria-label="Ga terug"
          className="mb-16 flex h-8 w-8 items-center justify-center text-foreground"
        >
          <ArrowIcon className="h-4 w-5" />
        </button>

        <section>
          <h1 className="text-[30px] font-black text-primary">Welkom</h1>
          <p className="mt-3 text-[30px] leading-tight text-foreground">
            Wat is toepasselijk?
          </p>
        </section>

        <section className="mt-24 space-y-3">
          {roles.map((role) => {
            const isSelected = selectedRole === role.value

            return (
              <button
                key={role.value}
                type="button"
                onClick={() => setSelectedRole(role.value)}
                className={[
                  'flex min-h-14.5 w-full items-center gap-3 rounded-xl border px-4 text-left text-sm font-bold transition-all duration-200',
                  isSelected
                    ? 'border-transparent bg-linear-to-r from-foreground to-primary text-white'
                    : 'border-foreground/30 bg-white text-foreground hover:border-primary/50',
                ].join(' ')}
              >
                <span
                  className={[
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                    isSelected ? 'border-white bg-white' : 'border-foreground/50 bg-white',
                  ].join(' ')}
                >
                  {isSelected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                </span>

                <span>{role.label}</span>
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
            disabled={!selectedRole || loading}
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