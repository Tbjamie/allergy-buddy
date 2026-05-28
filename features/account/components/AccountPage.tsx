'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BottomNavigation from '@/components/layout/BottomNavigation'
import { createClient } from '@/lib/supabase/client'
import type { AccountProfile, AccountProfileAllergen } from '@/app/account/page'

type AccountPageProps = {
  profile: AccountProfile
  profileAllergens: AccountProfileAllergen[]
  userEmail: string | null
}

export default function AccountPage({
  profile,
  profileAllergens,
  userEmail,
}: AccountPageProps) {
  const router = useRouter()
  const supabase = createClient()

  const [loadingLogout, setLoadingLogout] = useState(false)

  const displayName =
    profile.full_name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
    userEmail ||
    'Gebruiker'

  async function handleLogout() {
    setLoadingLogout(true)

    const { error } = await supabase.auth.signOut()

    setLoadingLogout(false)

    if (error) {
      console.error(error)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <main className="min-h-dvh bg-background px-fluid-main pb-32 pt-10">
      <div className="mx-auto max-w-md">
        <section>
          <p className="text-sm font-black text-primary">AllergyBuddy</p>
          <h1 className="mt-2 text-[32px] font-black leading-tight text-foreground">
            Account
          </h1>
          <p className="mt-4 text-sm leading-6 text-dark-gray">
            Bekijk je profiel, allergieën, noodcontact en reisinstellingen.
          </p>
        </section>

        <section className="mt-6 rounded-2xl bg-linear-to-r from-foreground to-primary p-5 text-white">
          <p className="text-sm font-bold text-white/70">Ingelogd als</p>
          <h2 className="mt-2 text-2xl font-black leading-tight">{displayName}</h2>
          {userEmail && <p className="mt-2 text-sm font-bold text-white/80">{userEmail}</p>}

          <div className="mt-5 w-full">
            <button
              type="button"
              onClick={handleLogout}
              disabled={loadingLogout}
              className="flex h-11 flex-1 items-center justify-center rounded-xl bg-white text-sm font-black text-foreground disabled:opacity-60 w-full"
            >
              {loadingLogout ? 'Uitloggen...' : 'Uitloggen'}
            </button>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-2 gap-3">
          <InfoCard
            label="Allergieën"
            value={`${profileAllergens.length}`}
            helper="Geselecteerd"
          />

          <InfoCard
            label="Anafylaxie"
            value={profile.anaphylaxis_risk ? 'Ja' : 'Nee'}
            helper="Profielsamenvatting"
            valueClassName={profile.anaphylaxis_risk ? 'text-red' : 'text-primary'}
          />
        </section>

        <section className="mt-6">
          <SectionHeader
            title="Mijn allergieën"
            href="/account/allergies/edit"
            actionLabel="Aanpassen"
          />

          <div className="mt-3 space-y-3">
            {profileAllergens.length === 0 ? (
              <EmptyCard text="Je hebt nog geen allergieën toegevoegd." />
            ) : (
              profileAllergens.map((item) => {
                const allergen = Array.isArray(item.allergens)
                  ? item.allergens[0]
                  : item.allergens

                if (!allergen) return null

                const severityStyles = getSeverityStyles(item.severity)

                return (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-foreground/15 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-base font-black text-foreground">
                          {allergen.name_nl}
                        </h3>

                        <p className="mt-1 text-sm font-medium text-dark-gray">
                          {allergen.name_en}
                          {allergen.name_tr ? ` · ${allergen.name_tr}` : ''}
                        </p>
                      </div>

                      <span
                        className={[
                          'shrink-0 rounded-full px-3 py-1 text-xs font-black',
                          severityStyles.badge,
                        ].join(' ')}
                      >
                        {severityStyles.label}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <BooleanPill
                        label="Anafylaxie"
                        value={item.causes_anaphylaxis}
                        danger={item.causes_anaphylaxis}
                      />
                      <BooleanPill
                        label="Kruisbesmetting"
                        value={item.cross_contamination_sensitive}
                      />
                    </div>

                    {item.user_notes && (
                      <p className="mt-3 rounded-xl bg-foreground/5 px-4 py-3 text-xs leading-5 text-dark-gray">
                        {item.user_notes}
                      </p>
                    )}
                  </article>
                )
              })
            )}
          </div>
        </section>

        <section className="mt-6">
          <SectionHeader title="Medische informatie" href="/account/medical/edit" actionLabel="Aanpassen" />

          <div className="mt-3 rounded-2xl border border-foreground/15 bg-white p-4">
            <div className="grid grid-cols-2 gap-2">
              <BooleanPill label="Diabetes" value={profile.diabetes} />
              <BooleanPill label="Astma" value={profile.asthma} />
              <BooleanPill label="Hartproblemen" value={profile.heart_condition} />
              <BooleanPill label="Epilepsie" value={profile.epilepsy} />
            </div>

            {(profile.medical_notes || profile.medication_notes) && (
              <div className="mt-4 space-y-3">
                {profile.medical_notes && (
                  <TextBlock label="Extra medische info" value={profile.medical_notes} />
                )}

                {profile.medication_notes && (
                  <TextBlock label="Medicatie / hulpmiddelen" value={profile.medication_notes} />
                )}
              </div>
            )}
          </div>
        </section>

        <section className="mt-6">
          <SectionHeader
            title="Noodcontact"
            href="/account/emergency-contact/edit"
            actionLabel="Aanpassen"
          />

          <div className="mt-3 rounded-2xl border border-foreground/15 bg-white p-4">
            {profile.emergency_contact_name || profile.emergency_contact_phone ? (
              <>
                <h3 className="text-lg font-black text-foreground">
                  {profile.emergency_contact_name ?? 'Noodcontact'}
                </h3>

                <p className="mt-1 text-sm font-medium text-dark-gray">
                  {formatRelation(profile.emergency_contact_relation, profile.emergency_contact_relation_custom)}
                  {profile.emergency_contact_language
                    ? ` · ${formatLanguages(profile.emergency_contact_language)}`
                    : ''}
                </p>

                {profile.emergency_contact_phone && (
                  <a
                    href={`tel:${profile.emergency_contact_phone}`}
                    className="mt-4 flex h-12 items-center justify-center rounded-xl bg-red text-sm font-black text-white"
                  >
                    Bel {profile.emergency_contact_phone}
                  </a>
                )}

                {profile.emergency_contact_note && (
                  <p className="mt-3 rounded-xl bg-foreground/5 px-4 py-3 text-xs leading-5 text-dark-gray">
                    {profile.emergency_contact_note}
                  </p>
                )}
              </>
            ) : (
              <EmptyCard text="Je hebt nog geen noodcontact toegevoegd." />
            )}
          </div>
        </section>

        <section className="mt-6">
          <SectionHeader title="Reis & locatie" href="/account/travel/edit" actionLabel="Aanpassen" />

          <div className="mt-3 rounded-2xl border border-foreground/15 bg-white p-4">
            <div className="grid grid-cols-2 gap-3">
              <MiniInfo label="Land" value={profile.destination_country ?? 'Niet ingesteld'} />
              <MiniInfo label="Stad/regio" value={profile.destination_city ?? 'Niet ingesteld'} />
            </div>

            <div className="mt-3">
              <BooleanPill
                label="Locatie delen"
                value={profile.location_sharing_enabled}
              />
            </div>
          </div>
        </section>

        <section className="mt-6">
          <SectionHeader title="Snelle acties" />

          <div className="mt-3 grid gap-3">
            <Link
              href="/sos"
              className="flex h-12 items-center justify-center rounded-xl bg-red text-sm font-black text-white"
            >
              SOS openen
            </Link>

            <Link
              href="/facts"
              className="flex h-12 items-center justify-center rounded-xl border border-foreground/20 bg-white text-sm font-black text-foreground"
            >
              Weetjes bekijken
            </Link>

            <Link
              href="/order-help"
              className="flex h-12 items-center justify-center rounded-xl border border-foreground/20 bg-white text-sm font-black text-foreground"
            >
              Bestelhulp openen
            </Link>
          </div>
        </section>
      </div>

      <BottomNavigation />
    </main>
  )
}

function formatLanguages(value: string | null) {
  if (!value) return ''

  const labels: Record<string, string> = {
    nl: 'Nederlands',
    en: 'Engels',
    tr: 'Turks',
    ar: 'Arabisch',
    other: 'Anders',
  }

  return value
    .split(',')
    .map((language) => labels[language.trim()] ?? language.trim())
    .join(', ')
}

function SectionHeader({
  title,
  href,
  actionLabel,
}: {
  title: string
  href?: string
  actionLabel?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-xl font-black text-foreground">{title}</h2>

      {href && actionLabel && (
        <Link href={href} className="text-xs font-black text-primary">
          {actionLabel}
        </Link>
      )}
    </div>
  )
}

function InfoCard({
  label,
  value,
  helper,
  valueClassName = 'text-primary',
}: {
  label: string
  value: string
  helper: string
  valueClassName?: string
}) {
  return (
    <div className="rounded-2xl border border-foreground/15 bg-white p-4">
      <p className="text-xs font-black uppercase tracking-wide text-dark-gray">{label}</p>
      <p className={['mt-2 text-3xl font-black', valueClassName].join(' ')}>{value}</p>
      <p className="mt-1 text-xs font-bold text-dark-gray">{helper}</p>
    </div>
  )
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-foreground/5 px-4 py-3">
      <p className="text-xs font-black uppercase tracking-wide text-dark-gray">{label}</p>
      <p className="mt-1 text-sm font-black text-foreground">{value}</p>
    </div>
  )
}

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-wide text-dark-gray">{label}</p>
      <p className="mt-1 text-sm leading-6 text-foreground">{value}</p>
    </div>
  )
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-foreground/15 bg-white p-4">
      <p className="text-sm leading-6 text-dark-gray">{text}</p>
    </div>
  )
}

function BooleanPill({
  label,
  value,
  danger = false,
}: {
  label: string
  value: boolean | null
  danger?: boolean | null
}) {
  return (
    <div
      className={[
        'rounded-xl px-3 py-2 text-xs font-black',
        value
          ? danger
            ? 'bg-red/10 text-red'
            : 'bg-primary/10 text-primary'
          : 'bg-foreground/5 text-dark-gray',
      ].join(' ')}
    >
      {value ? '✓' : '–'} {label}
    </div>
  )
}

function getSeverityStyles(severity: string | null) {
  if (severity === 'mild') {
    return {
      label: 'Mild',
      badge: 'bg-primary/10 text-primary',
    }
  }

  if (severity === 'moderate') {
    return {
      label: 'Gemiddeld',
      badge: 'bg-amber/20 text-amber-700',
    }
  }

  if (severity === 'severe') {
    return {
      label: 'Ernstig',
      badge: 'bg-orange-100 text-orange-600',
    }
  }

  if (severity === 'anaphylaxis_risk') {
    return {
      label: 'Anafylaxie',
      badge: 'bg-red/10 text-red',
    }
  }

  return {
    label: 'Onbekend',
    badge: 'bg-foreground/5 text-dark-gray',
  }
}

function formatRelation(relation: string | null, custom: string | null) {
  if (relation === 'parent') return 'Ouder'
  if (relation === 'partner') return 'Partner'
  if (relation === 'friend') return 'Vriend(in)'
  if (relation === 'sibling') return 'Broer / zus'
  if (relation === 'travel_companion') return 'Reisgenoot'
  if (relation === 'doctor') return 'Arts'
  if (relation === 'other') return custom || 'Anders'

  return 'Relatie onbekend'
}