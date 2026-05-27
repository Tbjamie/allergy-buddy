'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

type ConfidenceLevel = 'low' | 'medium' | 'high' | 'unknown'

type Restaurant = {
  id: string
  slug: string | null
  name: string
  country: string | null
  city: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  cuisine_type: string | null
  google_maps_url: string | null
  website_url: string | null
  phone: string | null
  community_confidence: ConfidenceLevel | null
  review_count: number | null
  community_rating: number | null
  last_reviewed_at: string | null
  metadata: Record<string, unknown> | null
}

type RestaurantImage = {
  id: string
  image_url: string
  alt_text: string | null
  caption: string | null
  is_primary: boolean
  sort_order: number
}

type RestaurantReview = {
  id: string
  restaurant_id: string
  profile_id: string
  title: string | null
  review_text: string | null
  warning_text: string | null
  recommended_dishes: string | null
  dishes_to_avoid: string | null
  allergy_context: string | null
  allergy_experience_rating: number | null
  communication_rating: number | null
  confidence_after_visit: ConfidenceLevel | null
  staff_understood_allergy: boolean | null
  staff_spoke_english: boolean | null
  staff_checked_with_kitchen: boolean | null
  cross_contamination_discussed: boolean | null
  separate_preparation_possible: boolean | null
  felt_taken_seriously: boolean | null
  would_return: boolean | null
  visited_at: string | null
  created_at: string
}

type ReviewFilter = 'all' | 'good' | 'mixed' | 'bad'

type RestaurantDetailContentProps = {
  profileId: string
  restaurant: Restaurant
  images: RestaurantImage[]
  reviews: RestaurantReview[]
}

export default function RestaurantDetailContent({
  profileId,
  restaurant,
  images,
  reviews,
}: RestaurantDetailContentProps) {
  const [activeImageId, setActiveImageId] = useState(images[0]?.id ?? null)
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all')
  const [writeReviewOpen, setWriteReviewOpen] = useState(false)

  const ratingValue = Number(restaurant.community_rating ?? 0)
  const ratingStyles = getRatingStyles(ratingValue)
  const activeImage = images.find((image) => image.id === activeImageId) ?? images[0]

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const score = Number(review.allergy_experience_rating ?? 0) * 2

      if (reviewFilter === 'good') return score >= 8
      if (reviewFilter === 'mixed') return score >= 5 && score < 8
      if (reviewFilter === 'bad') return score < 5

      return true
    })
  }, [reviews, reviewFilter])

  const filterCounts = useMemo(() => {
    return {
      all: reviews.length,
      good: reviews.filter((review) => Number(review.allergy_experience_rating ?? 0) * 2 >= 8)
        .length,
      mixed: reviews.filter((review) => {
        const score = Number(review.allergy_experience_rating ?? 0) * 2
        return score >= 5 && score < 8
      }).length,
      bad: reviews.filter((review) => Number(review.allergy_experience_rating ?? 0) * 2 < 5)
        .length,
    }
  }, [reviews])

  return (
    <main className="min-h-dvh bg-background pb-10">
      <section>
        {activeImage ? (
          <div className="relative h-72 w-full overflow-hidden rounded-b-4xl bg-foreground">
            <Image
              src={activeImage.image_url}
              alt={activeImage.alt_text ?? restaurant.name}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 420px"
              className="object-cover"
            />

            <div className="absolute inset-0 bg-linear-to-t from-foreground/45 via-transparent to-foreground/10" />

            {activeImage.caption && (
              <div className="absolute bottom-4 left-4 right-4">
                <p className="line-clamp-1 rounded-full bg-white/90 px-4 py-2 text-xs font-bold text-foreground backdrop-blur">
                  {activeImage.caption}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-64 w-full items-center justify-center rounded-b-4xl bg-foreground">
            <p className="text-sm font-bold text-white/70">Geen afbeelding beschikbaar</p>
          </div>
        )}

        {images.length > 1 && (
          <div className="-mt-8 flex gap-3 overflow-x-auto px-fluid-main pb-2 scrollbar-none">
            {images.map((image) => {
              const isActive = image.id === activeImage?.id

              return (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setActiveImageId(image.id)}
                  className={[
                    'relative h-20 w-24 shrink-0 overflow-hidden rounded-2xl border-2 bg-white shadow-lg transition-all',
                    isActive ? 'border-primary' : 'border-white',
                  ].join(' ')}
                >
                  <Image
                    src={image.image_url}
                    alt={image.alt_text ?? restaurant.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </button>
              )
            })}
          </div>
        )}
      </section>

      <div className="mx-auto max-w-md px-fluid-main">
        <div className="pt-6">
          <Link href="/" className="inline-flex text-sm font-black text-primary">
            ← Terug naar kaart
          </Link>
        </div>

        <section className="mt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[32px] font-black leading-tight text-foreground">
                {restaurant.name}
              </h1>

              <p className="mt-3 text-sm font-medium leading-6 text-dark-gray">
                {[restaurant.city, restaurant.cuisine_type].filter(Boolean).join(' · ')}
              </p>
            </div>

            <span
              className={[
                'shrink-0 rounded-full px-4 py-2 text-sm font-black',
                ratingStyles.badge,
              ].join(' ')}
            >
              {ratingValue.toFixed(1)}
            </span>
          </div>

          {restaurant.address && (
            <p className="mt-5 text-sm leading-6 text-foreground">{restaurant.address}</p>
          )}
        </section>

        <section className="mt-6 grid grid-cols-2 gap-3">
          <InfoCard
            label="Allergie-ervaringen"
            value={`${restaurant.review_count ?? reviews.length}`}
            helper="Community reviews"
          />

          <InfoCard
            label="Gemiddelde score"
            value={`${ratingValue.toFixed(1)}/10`}
            helper={getRatingLabel(ratingValue)}
            valueClassName={ratingStyles.text}
          />
        </section>

        <section className="mt-4 rounded-2xl bg-amber/15 px-4 py-4">
          <p className="text-sm font-black text-foreground">Belangrijk</p>
          <p className="mt-2 text-sm leading-6 text-foreground/80">
            Deze informatie komt uit community-ervaringen. AllergyBuddy geeft geen garantie dat
            eten veilig is. Vraag altijd opnieuw naar ingrediënten, bereiding en kruisbesmetting.
          </p>
        </section>

        <section className="mt-4 grid gap-3">
          {restaurant.google_maps_url && (
            <a
              href={restaurant.google_maps_url}
              target="_blank"
              rel="noreferrer"
              className="flex h-12 items-center justify-center rounded-xl bg-foreground text-sm font-black text-white"
            >
              Open in Google Maps
            </a>
          )}

          <div className="grid grid-cols-2 gap-3">
            {restaurant.website_url && (
              <a
                href={restaurant.website_url}
                target="_blank"
                rel="noreferrer"
                className="flex h-12 items-center justify-center rounded-xl border border-foreground/20 bg-white text-sm font-black text-foreground"
              >
                Website
              </a>
            )}

            {restaurant.phone && (
              <a
                href={`tel:${restaurant.phone}`}
                className="flex h-12 items-center justify-center rounded-xl border border-foreground/20 bg-white text-sm font-black text-foreground"
              >
                Bellen
              </a>
            )}
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-foreground">Reviews</h2>
              <p className="mt-1 text-sm leading-6 text-dark-gray">
                Ervaringen van gebruikers met allergieën.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setWriteReviewOpen(true)}
              className="rounded-full bg-primary px-4 py-2 text-xs font-black text-white"
            >
              Schrijf review
            </button>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <ReviewFilterChip
              active={reviewFilter === 'all'}
              label={`Alles ${filterCounts.all}`}
              onClick={() => setReviewFilter('all')}
            />
            <ReviewFilterChip
              active={reviewFilter === 'good'}
              label={`Goed ${filterCounts.good}`}
              onClick={() => setReviewFilter('good')}
            />
            <ReviewFilterChip
              active={reviewFilter === 'mixed'}
              label={`Gemengd ${filterCounts.mixed}`}
              onClick={() => setReviewFilter('mixed')}
            />
            <ReviewFilterChip
              active={reviewFilter === 'bad'}
              label={`Slecht ${filterCounts.bad}`}
              onClick={() => setReviewFilter('bad')}
            />
          </div>

          <div className="mt-4 space-y-4">
            {filteredReviews.length === 0 ? (
              <div className="rounded-2xl border border-foreground/15 bg-white p-5">
                <h3 className="text-lg font-black text-foreground">Geen reviews gevonden</h3>
                <p className="mt-2 text-sm leading-6 text-dark-gray">
                  Er zijn geen reviews binnen dit filter.
                </p>
              </div>
            ) : (
              filteredReviews.map((review) => <ReviewCard key={review.id} review={review} />)
            )}
          </div>
        </section>
      </div>

      <WriteReviewSheet
        open={writeReviewOpen}
        profileId={profileId}
        restaurantId={restaurant.id}
        onClose={() => setWriteReviewOpen(false)}
      />
    </main>
  )
}

function WriteReviewSheet({
  open,
  profileId,
  restaurantId,
  onClose,
}: {
  open: boolean
  profileId: string
  restaurantId: string
  onClose: () => void
}) {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [warningText, setWarningText] = useState('')
  const [recommendedDishes, setRecommendedDishes] = useState('')
  const [dishesToAvoid, setDishesToAvoid] = useState('')
  const [allergyContext, setAllergyContext] = useState('')
  const [allergyRating, setAllergyRating] = useState(4)
  const [communicationRating, setCommunicationRating] = useState(4)
  const [staffUnderstoodAllergy, setStaffUnderstoodAllergy] = useState(true)
  const [staffSpokeEnglish, setStaffSpokeEnglish] = useState(false)
  const [staffCheckedWithKitchen, setStaffCheckedWithKitchen] = useState(true)
  const [crossContaminationDiscussed, setCrossContaminationDiscussed] = useState(true)
  const [separatePreparationPossible, setSeparatePreparationPossible] = useState(false)
  const [feltTakenSeriously, setFeltTakenSeriously] = useState(true)
  const [wouldReturn, setWouldReturn] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!open) return null

  const canSubmit = title.trim().length > 0 && reviewText.trim().length > 0

  async function handleSubmit() {
    if (!canSubmit) return

    setLoading(true)
    setErrorMessage(null)

    const allergyScore = allergyRating * 2

    const confidenceAfterVisit =
        allergyScore <= 4 ? 'low' : allergyScore <= 7 ? 'medium' : 'high'

    const severityContext =
        allergyScore <= 4 ? 'severe' : allergyScore <= 7 ? 'moderate' : 'mild'

    const { error } = await supabase.from('restaurant_reviews').insert({
      restaurant_id: restaurantId,
      profile_id: profileId,
      visited_at: new Date().toISOString().slice(0, 10),

      title: title.trim(),
      review_text: reviewText.trim(),
      warning_text: warningText.trim() || null,
      recommended_dishes: recommendedDishes.trim() || null,
      dishes_to_avoid: dishesToAvoid.trim() || null,
      allergy_context: allergyContext.trim() || null,

      allergy_experience_rating: allergyRating,
      communication_rating: communicationRating,
      confidence_after_visit: confidenceAfterVisit,
      severity_context: severityContext,

      staff_understood_allergy: staffUnderstoodAllergy,
      staff_spoke_english: staffSpokeEnglish,
      staff_checked_with_kitchen: staffCheckedWithKitchen,
      cross_contamination_discussed: crossContaminationDiscussed,
      separate_preparation_possible: separatePreparationPossible,
      felt_taken_seriously: feltTakenSeriously,
      would_return: wouldReturn,

      is_based_on_personal_experience: true,
      source_note: 'user_review',
    })

    setLoading(false)

    if (error) {
      console.error(error)
      setErrorMessage('Je review kon niet worden opgeslagen.')
      return
    }

    onClose()
    router.refresh()
  }

  return (
    <div className="fixed inset-0 z-90">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/40"
        aria-label="Review sluiten"
        onClick={onClose}
      />

      <div className="absolute bottom-0 left-1/2 max-h-[90dvh] w-full max-w-md -translate-x-1/2 overflow-y-auto rounded-t-4xl bg-background px-fluid-main pb-8 pt-4 shadow-2xl">
        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-foreground/20" />

        <div>
          <h2 className="text-2xl font-black text-foreground">Review schrijven</h2>
          <p className="mt-2 text-sm leading-6 text-dark-gray">
            Deel hoe het restaurant omging met je allergie. Dit helpt andere reizigers, maar is
            geen veiligheidsgarantie.
          </p>
        </div>

        <div className="mt-6 space-y-5">
          <TextInput
            label="Titel"
            value={title}
            onChange={setTitle}
            placeholder="Bijvoorbeeld: Personeel nam mijn allergie serieus"
          />

          <Textarea
            label="Je ervaring"
            value={reviewText}
            onChange={setReviewText}
            placeholder="Wat gebeurde er? Werd de keuken geraadpleegd? Hoe duidelijk was de communicatie?"
          />

          <RatingSelector
            label="Allergie-ervaring"
            value={allergyRating}
            onChange={setAllergyRating}
          />

          <RatingSelector
            label="Communicatie"
            value={communicationRating}
            onChange={setCommunicationRating}
          />

          <Textarea
            label="Allergiecontext"
            value={allergyContext}
            onChange={setAllergyContext}
            placeholder="Bijvoorbeeld: notenallergie, kruisbesmetting belangrijk"
          />

          <Textarea
            label="Waarschuwing / let op"
            value={warningText}
            onChange={setWarningText}
            placeholder="Bijvoorbeeld: vraag specifiek naar gedeelde olie"
          />

          <Textarea
            label="Ging goed / aangeraden"
            value={recommendedDishes}
            onChange={setRecommendedDishes}
            placeholder="Bijvoorbeeld: simpele rijstgerechten zonder saus"
          />

          <Textarea
            label="Extra opletten bij"
            value={dishesToAvoid}
            onChange={setDishesToAvoid}
            placeholder="Bijvoorbeeld: sauzen, marinades, desserts"
          />

          <div className="space-y-3">
            <ToggleRow
              label="Personeel begreep mijn allergie"
              checked={staffUnderstoodAllergy}
              onClick={() => setStaffUnderstoodAllergy((value) => !value)}
            />
            <ToggleRow
              label="Personeel sprak Engels"
              checked={staffSpokeEnglish}
              onClick={() => setStaffSpokeEnglish((value) => !value)}
            />
            <ToggleRow
              label="Keuken werd geraadpleegd"
              checked={staffCheckedWithKitchen}
              onClick={() => setStaffCheckedWithKitchen((value) => !value)}
            />
            <ToggleRow
              label="Kruisbesmetting besproken"
              checked={crossContaminationDiscussed}
              onClick={() => setCrossContaminationDiscussed((value) => !value)}
            />
            <ToggleRow
              label="Aparte bereiding mogelijk"
              checked={separatePreparationPossible}
              onClick={() => setSeparatePreparationPossible((value) => !value)}
            />
            <ToggleRow
              label="Ik voelde mij serieus genomen"
              checked={feltTakenSeriously}
              onClick={() => setFeltTakenSeriously((value) => !value)}
            />
            <ToggleRow
              label="Ik zou teruggaan"
              checked={wouldReturn}
              onClick={() => setWouldReturn((value) => !value)}
            />
          </div>

          {errorMessage && (
            <div className="rounded-xl bg-red/10 px-4 py-3 text-sm font-bold text-red">
              {errorMessage}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-13 flex-1 rounded-xl border border-foreground/20 text-sm font-black text-foreground"
            >
              Annuleren
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || loading}
              className="h-13 flex-[1.5] rounded-xl bg-primary text-sm font-black text-white disabled:opacity-50"
            >
              {loading ? 'Opslaan...' : 'Review plaatsen'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ReviewFilterChip({
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
        'shrink-0 rounded-full border px-4 py-2 text-sm font-black transition-all',
        active
          ? 'border-transparent bg-linear-to-r from-foreground to-primary text-white'
          : 'border-foreground/20 bg-white text-foreground',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

function ReviewCard({ review }: { review: RestaurantReview }) {
  const rating = Number(review.allergy_experience_rating ?? 0) * 2
  const ratingStyles = getRatingStyles(rating)

  return (
    <article className="rounded-2xl border border-foreground/15 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-black leading-tight text-foreground">
            {review.title ?? 'Allergie-ervaring'}
          </h3>

          <p className="mt-1 text-xs font-bold text-dark-gray">
            {formatDate(review.visited_at ?? review.created_at)}
          </p>
        </div>

        <span
          className={[
            'shrink-0 rounded-full px-3 py-1 text-xs font-black',
            ratingStyles.badge,
          ].join(' ')}
        >
          {rating.toFixed(1)}
        </span>
      </div>

      {review.review_text && (
        <p className="mt-4 text-sm leading-6 text-foreground/85">{review.review_text}</p>
      )}

      {review.warning_text && (
        <div className="mt-4 rounded-xl bg-amber/15 px-4 py-3">
          <p className="text-xs font-black text-foreground">Let op</p>
          <p className="mt-1 text-xs leading-5 text-foreground/80">{review.warning_text}</p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <BooleanPill label="Keuken gecheckt" value={review.staff_checked_with_kitchen} />
        <BooleanPill label="Kruisbesmetting besproken" value={review.cross_contamination_discussed} />
        <BooleanPill label="Serieus genomen" value={review.felt_taken_seriously} />
        <BooleanPill label="Zou teruggaan" value={review.would_return} />
      </div>

      {(review.recommended_dishes || review.dishes_to_avoid) && (
        <div className="mt-4 space-y-3">
          {review.recommended_dishes && (
            <div>
              <p className="text-xs font-black text-primary">Ging goed / aangeraden</p>
              <p className="mt-1 text-xs leading-5 text-dark-gray">
                {review.recommended_dishes}
              </p>
            </div>
          )}

          {review.dishes_to_avoid && (
            <div>
              <p className="text-xs font-black text-red">Extra opletten bij</p>
              <p className="mt-1 text-xs leading-5 text-dark-gray">{review.dishes_to_avoid}</p>
            </div>
          )}
        </div>
      )}
    </article>
  )
}

function RatingSelector({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  const score = value * 2

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-4">
        <p className="text-sm font-black text-foreground">{label}</p>

        <span className="rounded-full bg-linear-to-r from-foreground to-primary px-3 py-1 text-xs font-black text-white">
          {score.toFixed(1)}
        </span>
      </div>

      <input
        type="range"
        min="1"
        max="10"
        step="1"
        value={score}
        onChange={(event) => onChange(Number(event.target.value) / 2)}
        className="rating-slider w-full"
        aria-label={label}
      />

      <div className="mt-2 flex justify-between text-xs font-bold text-dark-gray">
        <span>Slecht</span>
        <span>Gemiddeld</span>
        <span>Goed</span>
      </div>
    </div>
  )
}

function TextInput({
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
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-foreground/20 bg-white px-4 text-sm font-medium text-foreground outline-none placeholder:text-dark-gray/60 focus:border-primary"
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

function BooleanPill({ label, value }: { label: string; value: boolean | null }) {
  return (
    <div
      className={[
        'rounded-xl px-3 py-2 text-xs font-black',
        value ? 'bg-primary/10 text-primary' : 'bg-foreground/5 text-dark-gray',
      ].join(' ')}
    >
      {value ? '✓' : '–'} {label}
    </div>
  )
}

function getRatingStyles(value: number) {
  if (value <= 4) {
    return {
      badge: 'bg-red/10 text-red',
      text: 'text-red',
    }
  }

  if (value <= 6) {
    return {
      badge: 'bg-orange-100 text-orange-600',
      text: 'text-orange-600',
    }
  }

  if (value <= 8) {
    return {
      badge: 'bg-amber/20 text-amber-700',
      text: 'text-amber-700',
    }
  }

  return {
    badge: 'bg-primary/10 text-primary',
    text: 'text-primary',
  }
}

function getRatingLabel(value: number) {
  if (value <= 4) return 'Lage community-score'
  if (value <= 6) return 'Gemiddelde score'
  if (value <= 8) return 'Goede score'
  return 'Sterke score'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}