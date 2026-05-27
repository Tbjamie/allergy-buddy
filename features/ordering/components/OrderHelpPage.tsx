'use client'

import { useMemo, useState } from 'react'
import BottomNavigation from '@/components/layout/BottomNavigation'
import type { OrderHelpProfile, OrderHelpProfileAllergen } from '@/app/order-help/page'

type Answer = 'unknown' | 'yes' | 'no'

type LanguageCode = 'nl' | 'en' | 'tr' | 'es' | 'th' | 'de' | 'fr' | 'it' | 'ar'

type QuestionTemplate = {
  id: string
  nlTemplate: string
  templates: Record<LanguageCode, string>
  riskAnswer: Answer
  safeAnswer: Answer
  explanation: string
}

type ResolvedQuestion = {
  id: string
  nl: string
  translated: string
  riskAnswer: Answer
  safeAnswer: Answer
  explanation: string
}

type OrderHelpPageProps = {
  profile: OrderHelpProfile
  profileAllergens: OrderHelpProfileAllergen[]
}

const questionTemplates: QuestionTemplate[] = [
  {
    id: 'contains-allergens',
    nlTemplate: 'Zitten er {allergens} in dit gerecht?',
    templates: {
      nl: 'Zitten er {allergens} in dit gerecht?',
      en: 'Does this dish contain {allergens}?',
      tr: 'Bu yemeğin içinde {allergens} bulunuyor mu?',
      es: '¿Este plato contiene {allergens}?',
      th: 'อาหารจานนี้มี{allergens}หรือไม่?',
      de: 'Enthält dieses Gericht {allergens}?',
      fr: 'Ce plat contient-il {allergens} ?',
      it: 'Questo piatto contiene {allergens}?',
      ar: 'هل يحتوي هذا الطبق على {allergens}؟',
    },
    riskAnswer: 'yes',
    safeAnswer: 'no',
    explanation: 'Als het antwoord ja is, bestel dit gerecht niet.',
  },
  {
    id: 'shared-oil-pan-tools',
    nlTemplate:
      'Wordt dit gerecht bereid met dezelfde olie, pan of keukengerei als gerechten met {allergens}?',
    templates: {
      nl: 'Wordt dit gerecht bereid met dezelfde olie, pan of keukengerei als gerechten met {allergens}?',
      en: 'Is this dish prepared with the same oil, pan, or kitchen tools as dishes containing {allergens}?',
      tr: 'Bu yemek, {allergens} içeren yemeklerle aynı yağ, tava veya mutfak gereçleri kullanılarak mı hazırlanıyor?',
      es: '¿Este plato se prepara con el mismo aceite, sartén o utensilios que platos con {allergens}?',
      th: 'อาหารจานนี้ใช้น้ำมัน กระทะ หรืออุปกรณ์ครัวเดียวกับอาหารที่มี{allergens}หรือไม่?',
      de: 'Wird dieses Gericht mit demselben Öl, derselben Pfanne oder denselben Küchenutensilien zubereitet wie Gerichte mit {allergens}?',
      fr: 'Ce plat est-il préparé avec la même huile, poêle ou les mêmes ustensiles que des plats contenant {allergens} ?',
      it: 'Questo piatto viene preparato con lo stesso olio, la stessa padella o gli stessi utensili usati per piatti con {allergens}?',
      ar: 'هل يتم تحضير هذا الطبق باستخدام نفس الزيت أو المقلاة أو أدوات المطبخ المستخدمة لأطباق تحتوي على {allergens}؟',
    },
    riskAnswer: 'yes',
    safeAnswer: 'no',
    explanation: 'Gedeelde olie, pannen of keukengerei kunnen kruisbesmetting veroorzaken.',
  },
  {
    id: 'sauce-dressing-garnish',
    nlTemplate: 'Zitten er {allergens} in de saus, dressing of garnering?',
    templates: {
      nl: 'Zitten er {allergens} in de saus, dressing of garnering?',
      en: 'Are there {allergens} in the sauce, dressing, or garnish?',
      tr: 'Sos, dressing veya garnitürde {allergens} var mı?',
      es: '¿Hay {allergens} en la salsa, el aderezo o la guarnición?',
      th: 'ในซอส น้ำสลัด หรือเครื่องตกแต่งจานมี{allergens}หรือไม่?',
      de: 'Sind {allergens} in der Sauce, im Dressing oder in der Garnitur?',
      fr: 'Y a-t-il {allergens} dans la sauce, la vinaigrette ou la garniture ?',
      it: 'Ci sono {allergens} nella salsa, nel condimento o nella guarnizione?',
      ar: 'هل توجد {allergens} في الصلصة أو التتبيلة أو الزينة؟',
    },
    riskAnswer: 'yes',
    safeAnswer: 'no',
    explanation: 'Sauzen, dressings en garnering bevatten vaak verborgen ingrediënten.',
  },
  {
    id: 'separate-safe-preparation',
    nlTemplate: 'Kan de keuken dit gerecht apart en veilig bereiden zonder {allergens}?',
    templates: {
      nl: 'Kan de keuken dit gerecht apart en veilig bereiden zonder {allergens}?',
      en: 'Can the kitchen prepare this dish separately and safely without {allergens}?',
      tr: 'Mutfak bu yemeği {allergens} olmadan ayrı ve güvenli şekilde hazırlayabilir mi?',
      es: '¿La cocina puede preparar este plato por separado y de forma segura sin {allergens}?',
      th: 'ครัวสามารถเตรียมอาหารจานนี้แยกต่างหากและปลอดภัยโดยไม่มี{allergens}ได้หรือไม่?',
      de: 'Kann die Küche dieses Gericht getrennt und sicher ohne {allergens} zubereiten?',
      fr: 'La cuisine peut-elle préparer ce plat séparément et en toute sécurité sans {allergens} ?',
      it: 'La cucina può preparare questo piatto separatamente e in modo sicuro senza {allergens}?',
      ar: 'هل يمكن للمطبخ تحضير هذا الطبق بشكل منفصل وآمن بدون {allergens}؟',
    },
    riskAnswer: 'no',
    safeAnswer: 'yes',
    explanation: 'Als apart bereiden niet mogelijk is, blijft er risico op kruisbesmetting.',
  },
  {
    id: 'chef-is-sure',
    nlTemplate: 'Weet de kok zeker dat dit gerecht veilig is voor iemand met allergie voor {allergens}?',
    templates: {
      nl: 'Weet de kok zeker dat dit gerecht veilig is voor iemand met allergie voor {allergens}?',
      en: 'Is the chef sure this dish is safe for someone allergic to {allergens}?',
      tr: 'Aşçı bu yemeğin {allergens} alerjisi olan biri için güvenli olduğundan emin mi?',
      es: '¿El chef está seguro de que este plato es seguro para alguien con alergia a {allergens}?',
      th: 'เชฟมั่นใจหรือไม่ว่าอาหารจานนี้ปลอดภัยสำหรับผู้ที่แพ้{allergens}?',
      de: 'Ist der Koch sicher, dass dieses Gericht für jemanden mit einer Allergie gegen {allergens} sicher ist?',
      fr: 'Le chef est-il certain que ce plat est sûr pour une personne allergique à {allergens} ?',
      it: 'Lo chef è sicuro che questo piatto sia sicuro per una persona allergica a {allergens}?',
      ar: 'هل الشيف متأكد أن هذا الطبق آمن لشخص لديه حساسية من {allergens}؟',
    },
    riskAnswer: 'no',
    safeAnswer: 'yes',
    explanation: 'Als de kok twijfelt, bestel het gerecht niet.',
  },
]

const languageLabels: Record<LanguageCode, string> = {
  nl: 'Nederlands',
  en: 'Engels',
  tr: 'Turks',
  es: 'Spaans',
  th: 'Thais',
  de: 'Duits',
  fr: 'Frans',
  it: 'Italiaans',
  ar: 'Arabisch',
}

export default function OrderHelpPage({ profile, profileAllergens }: OrderHelpPageProps) {
  const destinationCountryCode = profile.destination_country || 'NL'
  const currentCountryCode = profile.current_country || null

  const destinationLanguage = getLanguageForCountry(destinationCountryCode)
  const currentLocationLanguage = currentCountryCode
    ? getLanguageForCountry(currentCountryCode)
    : null

  const availableLanguages = getAvailableLanguages({
    destinationLanguage,
    currentLocationLanguage,
  })

  const [language, setLanguage] = useState<LanguageCode>(destinationLanguage)
  const [useCurrentLocationLanguage, setUseCurrentLocationLanguage] = useState(false)
  const [answers, setAnswers] = useState<Record<string, Answer>>(() => {
    return questionTemplates.reduce<Record<string, Answer>>((acc, question) => {
      acc[question.id] = 'unknown'
      return acc
    }, {})
  })

  const allergenPhraseNl = getAllergenPhrase(profileAllergens, 'nl')
  const allergenPhraseTarget = getAllergenPhrase(profileAllergens, language)

  const questions = useMemo<ResolvedQuestion[]>(() => {
    return questionTemplates.map((question) => ({
      id: question.id,
      nl: applyTemplate(question.nlTemplate, allergenPhraseNl),
      translated: applyTemplate(question.templates[language], allergenPhraseTarget),
      riskAnswer: question.riskAnswer,
      safeAnswer: question.safeAnswer,
      explanation: question.explanation,
    }))
  }, [language, allergenPhraseNl, allergenPhraseTarget])

  const result = useMemo(() => getOrderRiskResult(answers, questions), [answers, questions])

  function updateAnswer(questionId: string, answer: Answer) {
    setAnswers((current) => ({
      ...current,
      [questionId]: answer,
    }))
  }

  return (
    <main className="min-h-dvh bg-background px-fluid-main pb-32 pt-10">
      <div className="mx-auto max-w-md">
        <section>
          <p className="text-sm font-black text-primary">AllergyBuddy</p>
          <h1 className="mt-2 text-[32px] font-black leading-tight text-foreground">
            Bestelhulp
          </h1>
          <p className="mt-4 text-sm leading-6 text-dark-gray">
            Laat deze vragen aan het restaurant zien. De allergenen komen uit je profiel en de taal
            wordt standaard aangepast op je reisland.
          </p>
        </section>

        <section className="mt-6 rounded-2xl bg-red/10 px-4 py-4">
          <p className="text-sm font-black text-red">Belangrijk</p>
          <p className="mt-2 text-sm leading-6 text-foreground">
            Bij twijfel, onduidelijkheid of kruisbesmettingsrisico: bestel het gerecht niet. Deze
            tool helpt bij communicatie, maar geeft geen veiligheidsgarantie.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-foreground/15 bg-white p-4">
          <p className="text-xs font-black uppercase tracking-wide text-dark-gray">
            Allergenen uit je profiel
          </p>
          <p className="mt-2 text-lg font-black text-foreground">{allergenPhraseNl}</p>
          <p
            className={[
              'mt-1 text-sm font-bold text-primary',
              language === 'ar' ? 'text-right' : '',
            ].join(' ')}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
            {allergenPhraseTarget}
          </p>
        </section>

        <section className="sticky top-0 z-20 -mx-fluid-main mt-6 bg-background/95 px-fluid-main py-4 backdrop-blur">
          <div className="rounded-2xl bg-foreground/5 px-4 py-3">
            <p className="text-xs font-black uppercase tracking-wide text-dark-gray">
              Aanbevolen taal
            </p>
            <p className="mt-1 text-sm font-black text-foreground">
              {languageLabels[destinationLanguage]} op basis van je reisbestemming
            </p>

            {currentLocationLanguage && currentLocationLanguage !== destinationLanguage && (
              <button
                type="button"
                onClick={() => {
                  setUseCurrentLocationLanguage(true)
                  setLanguage(currentLocationLanguage)
                }}
                className="mt-3 text-sm font-black text-primary"
              >
                Gebruik taal van huidige locatie: {languageLabels[currentLocationLanguage]}
              </button>
            )}

            {useCurrentLocationLanguage && (
              <button
                type="button"
                onClick={() => {
                  setUseCurrentLocationLanguage(false)
                  setLanguage(destinationLanguage)
                }}
                className="mt-2 block text-sm font-black text-red"
              >
                Terug naar taal van reisbestemming
              </button>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            {availableLanguages.map((languageOption) => (
              <LanguageButton
                key={languageOption}
                active={language === languageOption}
                label={languageLabels[languageOption]}
                onClick={() => {
                  setUseCurrentLocationLanguage(false)
                  setLanguage(languageOption)
                }}
              />
            ))}
          </div>

          <div
            className={[
              'mt-4 rounded-2xl px-4 py-4',
              result.status === 'danger'
                ? 'bg-red/10'
                : result.status === 'warning'
                  ? 'bg-amber/15'
                  : 'bg-primary/10',
            ].join(' ')}
          >
            <p
              className={[
                'text-sm font-black',
                result.status === 'danger'
                  ? 'text-red'
                  : result.status === 'warning'
                    ? 'text-amber-700'
                    : 'text-primary',
              ].join(' ')}
            >
              {result.title}
            </p>
            <p className="mt-2 text-sm leading-6 text-foreground">{result.description}</p>
          </div>
        </section>

        <section className="mt-4 space-y-4">
          {questions.map((question, index) => {
            const answer = answers[question.id]
            const answerStatus = getAnswerStatus(question, answer)

            return (
              <article
                key={question.id}
                className={[
                  'rounded-2xl border bg-white p-4',
                  answerStatus === 'danger'
                    ? 'border-red/30'
                    : answerStatus === 'safe'
                      ? 'border-primary/30'
                      : 'border-foreground/15',
                ].join(' ')}
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-black text-white">
                    {index + 1}
                  </span>

                  <div>
                    <p className="text-sm font-black leading-6 text-foreground">{question.nl}</p>

                    <p
                      className={[
                        'mt-3 text-xl font-black leading-7 text-primary',
                        language === 'ar' ? 'text-right' : '',
                      ].join(' ')}
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                    >
                      {question.translated}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <AnswerSlider
                    value={answer}
                    language={language}
                    onChange={(value) => updateAnswer(question.id, value)}
                  />
                </div>

                <div className="mt-4 rounded-xl bg-foreground/5 px-4 py-3">
                  <p className="text-xs font-black text-foreground">Waarom deze vraag?</p>
                  <p className="mt-1 text-xs leading-5 text-dark-gray">{question.explanation}</p>
                </div>
              </article>
            )
          })}
        </section>

        <section className="mt-6 rounded-2xl bg-[#0B1635] px-5 py-5 text-white">
          <p className="text-lg font-black">Laat dit zien aan personeel</p>

          <div className="mt-4 space-y-4 text-sm leading-6 text-white/90">
            <div>
              <p className="font-black text-white">Nederlands:</p>
              <p className="mt-1">
                Ik heb een ernstige allergie voor {allergenPhraseNl}. Kunt u deze vragen met de kok
                controleren voordat ik bestel?
              </p>
            </div>

            <div dir={language === 'ar' ? 'rtl' : 'ltr'}>
              <p className="font-black text-white">{languageLabels[language]}:</p>
              <p className="mt-1">{getStaffIntroText(language, allergenPhraseTarget)}</p>
            </div>
          </div>
        </section>
      </div>

      <BottomNavigation />
    </main>
  )
}

function AnswerSlider({
  value,
  language,
  onChange,
}: {
  value: Answer
  language: LanguageCode
  onChange: (value: Answer) => void
}) {
  const labels = getAnswerLabels(language)

  const options: {
    value: Answer
    label: string
  }[] = [
    { value: 'no', label: labels.no },
    { value: 'unknown', label: labels.unknown },
    { value: 'yes', label: labels.yes },
  ]

  return (
    <div className="rounded-2xl bg-foreground p-1.5">
      <div className="grid grid-cols-3 gap-1">
        {options.map((option) => {
          const active = value === option.value

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={[
                'h-11 rounded-xl text-sm font-black transition-all',
                active ? getAnswerActiveClass(option.value) : 'text-white/70',
              ].join(' ')}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function LanguageButton({
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
        'h-11 rounded-xl border text-sm font-black transition-all',
        active
          ? 'border-transparent bg-linear-to-r from-foreground to-primary text-white'
          : 'border-foreground/20 bg-white text-foreground',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

function getAnswerActiveClass(answer: Answer) {
  if (answer === 'yes') return 'bg-red text-white'
  if (answer === 'no') return 'bg-primary text-white'
  return 'bg-amber text-foreground'
}

function getAnswerStatus(question: ResolvedQuestion, answer: Answer) {
  if (answer === 'unknown') return 'warning'
  if (answer === question.riskAnswer) return 'danger'
  if (answer === question.safeAnswer) return 'safe'
  return 'warning'
}

function getOrderRiskResult(answers: Record<string, Answer>, questions: ResolvedQuestion[]) {
  const values = Object.values(answers)

  if (values.includes('unknown')) {
    return {
      status: 'warning' as const,
      title: 'Nog niet zeker',
      description:
        'Laat alle vragen beantwoorden door iemand die het gerecht en de bereiding echt kan controleren.',
    }
  }

  const hasDanger = questions.some((question) => answers[question.id] === question.riskAnswer)

  if (hasDanger) {
    return {
      status: 'danger' as const,
      title: 'Niet bestellen',
      description:
        'Minstens één antwoord wijst op een risico. Kies een ander gerecht of vraag om een veilig alternatief.',
    }
  }

  return {
    status: 'safe' as const,
    title: 'Lijkt mogelijk geschikt',
    description:
      'Alle antwoorden lijken gunstig. Controleer alsnog zelf en onthoud: AllergyBuddy geeft geen veiligheidsgarantie.',
  }
}

function applyTemplate(template: string, allergens: string) {
  return template.replaceAll('{allergens}', allergens)
}

function getAllergenPhrase(
  profileAllergens: OrderHelpProfileAllergen[],
  language: LanguageCode
) {
  const names = profileAllergens
    .map((item) => {
      const allergen = Array.isArray(item.allergens) ? item.allergens[0] : item.allergens
      if (!allergen) return null

      return getAllergenName(allergen, language)
    })
    .filter(Boolean) as string[]

  if (names.length === 0) {
    return getGenericAllergenPhrase(language)
  }

  return joinList(names, language)
}

function getAllergenName(
  allergen: {
    name_nl: string
    name_en: string | null
    name_tr: string | null
    slug: string
  },
  language: LanguageCode
) {
  const custom = allergenTranslations[allergen.slug]?.[language]

  if (custom) return custom
  if (language === 'nl') return allergen.name_nl
  if (language === 'tr') return allergen.name_tr ?? allergen.name_en ?? allergen.name_nl
  if (language === 'en') return allergen.name_en ?? allergen.name_nl

  return allergen.name_en ?? allergen.name_nl
}

function joinList(items: string[], language: LanguageCode) {
  if (items.length === 1) return items[0]

  const conjunctions: Record<LanguageCode, string> = {
    nl: 'en',
    en: 'and',
    tr: 've',
    es: 'y',
    th: 'และ',
    de: 'und',
    fr: 'et',
    it: 'e',
    ar: 'و',
  }

  if (language === 'ar') return items.join(' و ')
  if (language === 'th') return items.join(' และ ')

  return `${items.slice(0, -1).join(', ')} ${conjunctions[language]} ${items.at(-1)}`
}

function getGenericAllergenPhrase(language: LanguageCode) {
  const phrases: Record<LanguageCode, string> = {
    nl: 'mijn allergenen',
    en: 'my allergens',
    tr: 'alerjenlerim',
    es: 'mis alérgenos',
    th: 'สารก่อภูมิแพ้ของฉัน',
    de: 'meine Allergene',
    fr: 'mes allergènes',
    it: 'i miei allergeni',
    ar: 'مسببات الحساسية لدي',
  }

  return phrases[language]
}

function getLanguageForCountry(countryCode: string): LanguageCode {
  const normalizedCode = countryCode.toUpperCase()

  const map: Record<string, LanguageCode> = {
    NL: 'nl',
    BE: 'nl',
    TR: 'tr',
    ES: 'es',
    MX: 'es',
    AR: 'es',
    CO: 'es',
    PE: 'es',
    CL: 'es',
    TH: 'th',
    DE: 'de',
    AT: 'de',
    CH: 'de',
    FR: 'fr',
    IT: 'it',
    AE: 'ar',
    SA: 'ar',
    EG: 'ar',
    MA: 'ar',
    GB: 'en',
    US: 'en',
    IE: 'en',
    AU: 'en',
    CA: 'en',
  }

  return map[normalizedCode] ?? 'en'
}

function getAvailableLanguages({
  destinationLanguage,
  currentLocationLanguage,
}: {
  destinationLanguage: LanguageCode
  currentLocationLanguage: LanguageCode | null
}): LanguageCode[] {
  const languages: LanguageCode[] = [
    destinationLanguage,
    ...(currentLocationLanguage ? [currentLocationLanguage] : []),
    // 'en',
    'nl',
    // 'tr',
    // 'ar',
  ]

  return Array.from(new Set(languages))
}

function getAnswerLabels(language: LanguageCode) {
  const labels: Record<LanguageCode, { yes: string; no: string; unknown: string }> = {
    nl: { yes: 'Ja', no: 'Nee', unknown: 'Onzeker' },
    en: { yes: 'Yes', no: 'No', unknown: 'Unsure' },
    tr: { yes: 'Evet', no: 'Hayır', unknown: 'Emin değilim' },
    es: { yes: 'Sí', no: 'No', unknown: 'No seguro' },
    th: { yes: 'ใช่', no: 'ไม่ใช่', unknown: 'ไม่แน่ใจ' },
    de: { yes: 'Ja', no: 'Nein', unknown: 'Unsicher' },
    fr: { yes: 'Oui', no: 'Non', unknown: 'Pas sûr' },
    it: { yes: 'Sì', no: 'No', unknown: 'Non sicuro' },
    ar: { yes: 'نعم', no: 'لا', unknown: 'غير متأكد' },
  }

  return labels[language]
}

function getStaffIntroText(language: LanguageCode, allergens: string) {
  const texts: Record<LanguageCode, string> = {
    nl: `Ik heb een ernstige allergie voor ${allergens}. Kunt u deze vragen met de kok controleren voordat ik bestel?`,
    en: `I have a serious allergy to ${allergens}. Can you check these questions with the chef before I order?`,
    tr: `${allergens} alerjim ciddi. Sipariş vermeden önce bu soruları aşçıyla kontrol edebilir misiniz?`,
    es: `Tengo una alergia grave a ${allergens}. ¿Puede revisar estas preguntas con el chef antes de que pida?`,
    th: `ฉันมีอาการแพ้${allergens}อย่างรุนแรง กรุณาตรวจสอบคำถามเหล่านี้กับเชฟก่อนที่ฉันจะสั่งอาหารได้ไหม?`,
    de: `Ich habe eine schwere Allergie gegen ${allergens}. Können Sie diese Fragen bitte mit dem Koch prüfen, bevor ich bestelle?`,
    fr: `J’ai une allergie sévère à ${allergens}. Pouvez-vous vérifier ces questions avec le chef avant que je commande ?`,
    it: `Ho una grave allergia a ${allergens}. Può controllare queste domande con lo chef prima che ordini?`,
    ar: `لدي حساسية شديدة من ${allergens}. هل يمكنك مراجعة هذه الأسئلة مع الشيف قبل أن أطلب الطعام؟`,
  }

  return texts[language]
}

const allergenTranslations: Record<string, Partial<Record<LanguageCode, string>>> = {
  noten: {
    en: 'tree nuts',
    tr: 'kuruyemiş',
    es: 'frutos secos',
    th: 'ถั่วเปลือกแข็ง',
    de: 'Schalenfrüchte',
    fr: 'fruits à coque',
    it: 'frutta a guscio',
    ar: 'المكسرات',
  },
  pinda: {
    en: 'peanuts',
    tr: 'yer fıstığı',
    es: 'cacahuetes',
    th: 'ถั่วลิสง',
    de: 'Erdnüsse',
    fr: 'arachides',
    it: 'arachidi',
    ar: 'الفول السوداني',
  },
  melk: {
    en: 'milk',
    tr: 'süt',
    es: 'leche',
    th: 'นม',
    de: 'Milch',
    fr: 'lait',
    it: 'latte',
    ar: 'الحليب',
  },
  ei: {
    en: 'egg',
    tr: 'yumurta',
    es: 'huevo',
    th: 'ไข่',
    de: 'Ei',
    fr: 'œuf',
    it: 'uovo',
    ar: 'البيض',
  },
  gluten: {
    en: 'gluten',
    tr: 'gluten',
    es: 'gluten',
    th: 'กลูเตน',
    de: 'Gluten',
    fr: 'gluten',
    it: 'glutine',
    ar: 'الغلوتين',
  },
  vis: {
    en: 'fish',
    tr: 'balık',
    es: 'pescado',
    th: 'ปลา',
    de: 'Fisch',
    fr: 'poisson',
    it: 'pesce',
    ar: 'السمك',
  },
  schaaldieren: {
    en: 'shellfish',
    tr: 'kabuklu deniz ürünleri',
    es: 'mariscos',
    th: 'อาหารทะเลมีเปลือก',
    de: 'Schalentiere',
    fr: 'crustacés',
    it: 'crostacei',
    ar: 'المحار والقشريات',
  },
  soja: {
    en: 'soy',
    tr: 'soya',
    es: 'soja',
    th: 'ถั่วเหลือง',
    de: 'Soja',
    fr: 'soja',
    it: 'soia',
    ar: 'الصويا',
  },
  sesam: {
    en: 'sesame',
    tr: 'susam',
    es: 'sésamo',
    th: 'งา',
    de: 'Sesam',
    fr: 'sésame',
    it: 'sesamo',
    ar: 'السمسم',
  },
  lupine: {
    en: 'lupin',
    tr: 'lupin',
    es: 'altramuz',
    th: 'ลูพิน',
    de: 'Lupine',
    fr: 'lupin',
    it: 'lupino',
    ar: 'الترمس',
  },
  selderij: {
    en: 'celery',
    tr: 'kereviz',
    es: 'apio',
    th: 'ขึ้นฉ่าย',
    de: 'Sellerie',
    fr: 'céleri',
    it: 'sedano',
    ar: 'الكرفس',
  },
}