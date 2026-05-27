'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import type { AccountMedicalEditProfile } from '@/app/account/medical/edit/page'

type AccountMedicalEditPageProps = {
  profile: AccountMedicalEditProfile
}

export default function AccountMedicalEditPage({ profile }: AccountMedicalEditPageProps) {
  const router = useRouter()
  const supabase = createClient()

  const [diabetes, setDiabetes] = useState(profile.diabetes ?? false)
  const [asthma, setAsthma] = useState(profile.asthma ?? false)
  const [heartCondition, setHeartCondition] = useState(profile.heart_condition ?? false)
  const [epilepsy, setEpilepsy] = useState(profile.epilepsy ?? false)
  const [hasOtherMedicalConditions, setHasOtherMedicalConditions] = useState(
    profile.has_other_medical_conditions ?? false
  )
  const [medicalNotes, setMedicalNotes] = useState(profile.medical_notes ?? '')
  const [medicationNotes, setMedicationNotes] = useState(profile.medication_notes ?? '')

  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setErrorMessage(null)

    const hasAnyMedicalInfo =
      diabetes ||
      asthma ||
      heartCondition ||
      epilepsy ||
      hasOtherMedicalConditions ||
      medicalNotes.trim().length > 0 ||
      medicationNotes.trim().length > 0

    const { error } = await supabase
      .from('profiles')
      .update({
        has_other_medical_conditions: hasAnyMedicalInfo,
        diabetes,
        asthma,
        heart_condition: heartCondition,
        epilepsy,
        medical_notes: medicalNotes.trim() || null,
        medication_notes: medicationNotes.trim() || null,
      })
      .eq('id', profile.id)

    setSaving(false)

    if (error) {
      console.error(error)
      setErrorMessage('Er ging iets mis bij het opslaan van je medische informatie.')
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
            Medische informatie
          </h1>
          <p className="mt-4 text-sm leading-6 text-dark-gray">
            Voeg informatie toe die belangrijk kan zijn tijdens een allergische reactie of
            noodsituatie.
          </p>
        </section>

        <section className="mt-6 space-y-3">
          <ToggleCard
            title="Diabetes"
            description="Bijvoorbeeld diabetes type 1 of type 2."
            checked={diabetes}
            onClick={() => setDiabetes((value) => !value)}
          />

          <ToggleCard
            title="Astma"
            description="Kan belangrijk zijn bij benauwdheid of ademhaling."
            checked={asthma}
            onClick={() => setAsthma((value) => !value)}
          />

          <ToggleCard
            title="Hartproblemen"
            description="Relevante informatie voor hulpdiensten of omstanders."
            checked={heartCondition}
            onClick={() => setHeartCondition((value) => !value)}
          />

          <ToggleCard
            title="Epilepsie"
            description="Kan belangrijk zijn bij een noodsituatie."
            checked={epilepsy}
            onClick={() => setEpilepsy((value) => !value)}
          />

          <ToggleCard
            title="Andere medische informatie"
            description="Bijvoorbeeld aandoeningen, beperkingen of aandachtspunten."
            checked={hasOtherMedicalConditions}
            onClick={() => setHasOtherMedicalConditions((value) => !value)}
          />
        </section>

        <section className="mt-6 space-y-5">
          <Textarea
            label="Extra medische informatie"
            value={medicalNotes}
            onChange={setMedicalNotes}
            placeholder="Bijvoorbeeld: Ik heb diabetes type 1 en draag meestal glucose bij me."
          />

          <Textarea
            label="Medicatie of hulpmiddelen"
            value={medicationNotes}
            onChange={setMedicationNotes}
            placeholder="Bijvoorbeeld: EpiPen in rugtas, antihistamine in jaszak, insuline in etui."
          />
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
        'flex w-full items-center justify-between gap-4 rounded-2xl border px-4 py-4 text-left transition-all',
        checked
          ? 'border-transparent bg-linear-to-r from-foreground to-primary text-white'
          : 'border-foreground/15 bg-white text-foreground',
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
        className="min-h-28 w-full resize-none rounded-xl border border-foreground/20 bg-white px-4 py-3 text-sm font-medium text-foreground outline-none placeholder:text-dark-gray/60 focus:border-primary"
      />
    </div>
  )
}