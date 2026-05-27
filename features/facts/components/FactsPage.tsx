'use client'

import { useMemo, useState } from 'react'
import BottomNavigation from '@/components/layout/BottomNavigation'
import type { AllergyFact } from '@/app/facts/page'

type FactCategory =
  | 'all'
  | 'worsen'
  | 'help'
  | 'general'
  | 'emergency'
  | 'travel'
  | 'restaurant'

type FactsPageProps = {
  facts: AllergyFact[]
}

const filters: {
  value: FactCategory
  label: string
}[] = [
  { value: 'all', label: 'Alles' },
  { value: 'worsen', label: 'Erger maken' },
  { value: 'help', label: 'Helpen' },
  { value: 'general', label: 'Algemeen' },
  { value: 'emergency', label: 'Nood' },
  { value: 'travel', label: 'Reizen' },
  { value: 'restaurant', label: 'Restaurant' },
]

export default function FactsPage({ facts }: FactsPageProps) {
  const [activeFilter, setActiveFilter] = useState<FactCategory>('all')
  const [search, setSearch] = useState('')

  const filteredFacts = useMemo(() => {
    const query = search.trim().toLowerCase()

    return facts.filter((fact) => {
      const matchesFilter = activeFilter === 'all' || fact.category === activeFilter

      const matchesSearch =
        !query ||
        fact.title_nl.toLowerCase().includes(query) ||
        fact.body_nl.toLowerCase().includes(query) ||
        fact.tag.toLowerCase().includes(query) ||
        fact.category.toLowerCase().includes(query)

      return matchesFilter && matchesSearch
    })
  }, [facts, activeFilter, search])

  return (
    <main className="min-h-dvh bg-background px-fluid-main pb-32 pt-10">
      <div className="mx-auto max-w-md">
        <section>
          <p className="text-sm font-black text-primary">AllergyBuddy</p>
          <h1 className="mt-2 text-[32px] font-black leading-tight text-foreground">
            Allergie weetjes
          </h1>
          <p className="mt-4 text-sm leading-6 text-dark-gray">
            Praktische informatie over factoren die allergische reacties kunnen beïnvloeden.
            Gebruik dit als geheugensteun, niet als persoonlijk medisch advies.
          </p>
        </section>

        <section className="mt-6 rounded-2xl bg-red/10 px-4 py-4">
          <p className="text-sm font-black text-red">Belangrijk</p>
          <p className="mt-2 text-sm leading-6 text-foreground">
            Bij ernstige klachten of verdenking op anafylaxie: gebruik je noodmedicatie volgens
            je eigen actieplan en schakel direct medische hulp in.
          </p>
        </section>

        <section className="sticky top-0 z-20 -mx-fluid-main mt-6 bg-background/95 px-fluid-main py-4 backdrop-blur">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Zoek op alcohol, EpiPen, kruisbesmetting..."
            className="h-12 w-full rounded-xl border border-foreground/20 bg-white px-4 text-sm font-medium text-foreground outline-none placeholder:text-dark-gray/60 focus:border-primary"
          />

          <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none pb-1">
            {filters.map((filter) => {
              const isActive = activeFilter === filter.value
              const count =
                filter.value === 'all'
                  ? facts.length
                  : facts.filter((fact) => fact.category === filter.value).length

              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setActiveFilter(filter.value)}
                  className={[
                    'shrink-0 rounded-full border px-4 py-2 text-sm font-black transition-all',
                    isActive
                      ? 'border-transparent bg-linear-to-r from-foreground to-primary text-white'
                      : 'border-foreground/20 bg-white text-foreground',
                  ].join(' ')}
                >
                  {filter.label}
                  <span className={isActive ? 'ml-1 text-white/70' : 'ml-1 text-dark-gray'}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          <p className="mt-3 text-xs font-bold text-dark-gray">
            {filteredFacts.length} van {facts.length} weetjes zichtbaar
          </p>
        </section>

        <section className="mt-2 space-y-4">
          {filteredFacts.length === 0 ? (
            <div className="rounded-2xl border border-foreground/15 bg-white p-5">
              <h2 className="text-lg font-black text-foreground">Geen weetjes gevonden</h2>
              <p className="mt-2 text-sm leading-6 text-dark-gray">
                Probeer een andere zoekterm of filter.
              </p>
            </div>
          ) : (
            filteredFacts.map((fact) => {
              const categoryStyles = getFactCategoryStyles(fact.category)

              return (
                <article
                  key={fact.id}
                  className={[
                    'rounded-2xl border bg-white p-4',
                    fact.important ? 'border-red/30' : 'border-foreground/15',
                  ].join(' ')}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <span
                      className={[
                        'rounded-full px-3 py-1 text-xs font-black',
                        categoryStyles.badge,
                      ].join(' ')}
                    >
                      {categoryStyles.label}
                    </span>

                    <span className="rounded-full bg-foreground/5 px-3 py-1 text-xs font-black text-dark-gray">
                      {fact.tag}
                    </span>
                  </div>

                  <h2 className="text-lg font-black leading-tight text-foreground">
                    {fact.title_nl}
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-dark-gray">{fact.body_nl}</p>

                  <a
                    href={fact.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex text-xs font-black text-primary"
                  >
                    Bron: {fact.source_name}
                  </a>
                </article>
              )
            })
          )}
        </section>
      </div>

      <BottomNavigation />
    </main>
  )
}

function getFactCategoryStyles(category: AllergyFact['category']) {
  if (category === 'worsen') {
    return {
      label: 'Kan verergeren',
      badge: 'bg-red/10 text-red',
    }
  }

  if (category === 'help') {
    return {
      label: 'Kan helpen',
      badge: 'bg-primary/10 text-primary',
    }
  }

  if (category === 'emergency') {
    return {
      label: 'Nood',
      badge: 'bg-foreground text-white',
    }
  }

  if (category === 'travel') {
    return {
      label: 'Reizen',
      badge: 'bg-blue-100 text-blue-700',
    }
  }

  if (category === 'restaurant') {
    return {
      label: 'Restaurant',
      badge: 'bg-purple-100 text-purple-700',
    }
  }

  return {
    label: 'Algemeen',
    badge: 'bg-amber/20 text-amber-700',
  }
}