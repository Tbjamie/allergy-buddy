import { ButtonLink } from '@/components/ui/Button'
import Image from 'next/image'
import Logo from '@/components/icons/Logo'

export default function AuthOnboarding() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-background">
      <Image
        src="/images/home-allergens.png"
        alt="Home Allergens"
        className="absolute left-0 top-0 h-auto w-full max-w-3xl"
        width={500}
        height={300}
        priority
      />

      <div className="relative z-10 mx-auto flex min-h-dvh max-w-md flex-col justify-between px-fluid-main pb-10">
        <section className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="flex h-75 w-full items-center justify-center">
            <Image
              src="/images/home-hero-nut-milk.png"
              alt="Home Nut & Milk"
              className="h-auto w-55 max-w-md mx-auto"
              width={220}
              height={207}
              priority
            />
          </div>

          <div className="flex flex-col items-center gap-8">
            <h1 className="text-[32px] font-bold text-foreground">
                Welkom bij
                <span className="sr-only">Allergy Buddy</span>
            </h1>
            <Logo className="mx-auto h-9 w-auto" />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <ButtonLink href="/login" variant="primary" fullWidth>
            Inloggen
          </ButtonLink>

          <ButtonLink href="/register" variant="secondary" fullWidth>
            Account aanmaken
          </ButtonLink>
        </section>
      </div>
    </main>
  )
}