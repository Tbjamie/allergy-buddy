'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import type {
  AccountEmergencyContactEditProfile,
  EmergencyContactRelation,
} from '@/app/account/emergency-contact/edit/page'

const relationOptions: {
  value: EmergencyContactRelation
  label: string
}[] = [
  { value: 'parent', label: 'Ouder' },
  { value: 'partner', label: 'Partner' },
  { value: 'friend', label: 'Vriend(in)' },
  { value: 'sibling', label: 'Broer / zus' },
  { value: 'travel_companion', label: 'Reisgenoot' },
  { value: 'doctor', label: 'Arts' },
  { value: 'other', label: 'Anders' },
]

const languageOptions = [
  { value: 'nl', label: 'Nederlands' },
  { value: 'en', label: 'Engels' },
  { value: 'tr', label: 'Turks' },
  { value: 'ar', label: 'Arabisch' },
  { value: 'other', label: 'Anders' },
]

export default function AccountEmergencyContactEditPage({
  profile,
}: {
  profile: AccountEmergencyContactEditProfile
}) {
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
  const [language, setLanguage] = useState(profile.emergency_contact_language ?? 'nl')
  const [note, setNote] = useState(profile.emergency_contact_note ?? '')

  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const canSave = name.trim().length > 0 && phone.trim().length > 0 && relation !== null

  async function handleSave() {
    if (!canSave) return

    setSaving(true)
    setErrorMessage(null)

    const normalizedName = name.trim()
    const normalizedPhone = phone.trim()
    const normalizedRelationCustom = relation === 'other' ? relationCustom.trim() || null : null
    const normalizedNote = note.trim() || null

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        emergency_contact_name: normalizedName,
        emergency_contact_phone: normalizedPhone,
        emergency_contact_relation: relation,
        emergency_contact_relation_custom: normalizedRelationCustom,
        emergency_contact_language: language,
        emergency_contact_note: normalizedNote,
      })
      .eq('id', profile.id)

    if (profileError) {
      setSaving(false)
      console.error(profileError)
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
      const { error } = await supabase
        .from('emergency_contacts')
        .update({
          name: normalizedName,
          phone: normalizedPhone,
          relation,
          relation_custom: normalizedRelationCustom,
          language,
          note: normalizedNote,
          can_be_called: true,
          priority: 1,
        })
        .eq('id', existingContact.id)
        .eq('profile_id', profile.id)

      if (error) {
        setSaving(false)
        console.error(error)
        setErrorMessage('Je profiel is opgeslagen, maar de noodcontact-tabel kon niet worden bijgewerkt.')
        return
      }
    } else {
      const { error } = await supabase.from('emergency_contacts').insert({
        profile_id: profile.id,
        name: normalizedName,
        phone: normalizedPhone,
        relation,
        relation_custom: normalizedRelationCustom,
        language,
        note: normalizedNote,
        can_be_called: true,
        priority: 1,
      })

      if (error) {
        setSaving(false)
        console.error(error)
        setErrorMessage('Je profiel is opgeslagen, maar je noodcontact kon niet worden aangemaakt.')
        return
      }
    }

    setSaving(false)

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
            Noodcontact
          </h1>
          <p className="mt-4 text-sm leading-6 text-dark-gray">
            Voeg iemand toe die gebeld kan worden in een noodsituatie.
          </p>
        </section>

        <section className="mt-6 space-y-5">
          <TextInput
            label="Naam noodcontact"
            value={name}
            onChange={setName}
            placeholder="Bijvoorbeeld: Mohammed Yamani"
          />

          <TextInput
            label="Telefoonnummer"
            value={phone}
            onChange={setPhone}
            placeholder="+31 6 12 34 56 78"
            type="tel"
          />

          <div>
            <p className="mb-3 text-sm font-black text-foreground">Relatie tot jou</p>

            <div className="grid grid-cols-2 gap-3">
              {relationOptions.map((option) => (
                <ChoiceButton
                  key={option.value}
                  active={relation === option.value}
                  label={option.label}
                  onClick={() => setRelation(option.value)}
                />
              ))}
            </div>
          </div>

          {relation === 'other' && (
            <TextInput
              label="Welke relatie?"
              value={relationCustom}
              onChange={setRelationCustom}
              placeholder="Bijvoorbeeld: collega, buur, mentor"
            />
          )}

          <div>
            <p className="mb-3 text-sm font-black text-foreground">Taal van noodcontact</p>

            <div className="grid grid-cols-2 gap-3">
              {languageOptions.map((option) => (
                <ChoiceButton
                  key={option.value}
                  active={language === option.value}
                  label={option.label}
                  onClick={() => setLanguage(option.value)}
                />
              ))}
            </div>
          </div>

          <Textarea
            label="Extra notitie"
            value={note}
            onChange={setNote}
            placeholder="Bijvoorbeeld: Deze persoon weet waar mijn EpiPen ligt."
          />
        </section>

        {errorMessage && (
          <div className="mt-6 rounded-xl bg-red/10 px-4 py-3 text-sm font-bold text-red">
            {errorMessage}
          </div>
        )}

        <div className="sticky bottom-0 -mx-fluid-main mt-8 bg-background/95 px-fluid-main py-4 backdrop-blur">
          <Button
            type="button"
            variant="primary"
            fullWidth
            disabled={!canSave || saving}
            onClick={handleSave}
          >
            {saving ? 'Opslaan...' : 'Wijzigingen opslaan'}
          </Button>
        </div>
      </div>
    </main>
  )
}

function ChoiceButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'min-h-11 rounded-xl border px-3 text-sm font-black transition-all',
        active
          ? 'border-transparent bg-linear-to-r from-foreground to-primary text-white'
          : 'border-foreground/20 bg-white text-foreground',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  type?: string
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black text-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-14 w-full rounded-xl border border-foreground/20 bg-white px-4 text-sm font-medium text-foreground outline-none placeholder:text-dark-gray/60 focus:border-primary"
      />
    </div>
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