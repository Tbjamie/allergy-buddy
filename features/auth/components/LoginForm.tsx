'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import ArrowIcon from '@/components/icons/ArrowIcon'
import Link from 'next/link'

export default function LoginForm() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleLogin(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    setLoading(true)
    setErrorMessage(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setErrorMessage('E-mailadres of wachtwoord is onjuist.')
      return
    }

    router.refresh()
  }

  return (
    <main className="min-h-dvh bg-white px-fluid-main">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col pb-10 pt-16">
        <Link
            href="/"
            className="mb-16 flex h-8 w-8 items-center justify-center text-black"
            aria-label="Ga terug"
            >
            <ArrowIcon className="h-4" />
        </Link>

        <section>
          <h1 className="text-[30px] font-black text-[#008080]">Log in</h1>
          <p className="mt-3 text-[30px] leading-tight text-[#111827]">Welkom terug!</p>
        </section>

        <form onSubmit={handleLogin} className="mt-16 flex flex-1 flex-col">
          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-bold text-[#111827]">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="E-mailadres"
                className="h-14.5 w-full rounded-xl border border-gray-300 px-4 text-sm text-[#111827] outline-none placeholder:text-gray-300 focus:border-[#008080]"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-bold text-[#111827]">
                Wachtwoord
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••••••"
                className="h-14.5 w-full rounded-xl border border-gray-300 px-4 text-sm text-[#111827] outline-none placeholder:text-gray-300 focus:border-[#008080]"
              />
            </div>

            {errorMessage && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {errorMessage}
              </div>
            )}

            <div className="flex items-center gap-3 py-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-sm font-medium text-gray-500">Of</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className="flex h-12.5 items-center justify-center rounded-xl border border-gray-300 bg-white text-xl font-bold"
              >
                <span className="text-[#4285F4]">G</span>
              </button>

              <button
                type="button"
                className="flex h-12.5 items-center justify-center rounded-xl bg-[#1877F2] text-xl font-bold text-white"
              >
                f
              </button>
            </div>
          </div>

          <div className="mt-auto space-y-5 pt-12">
            <Button type="submit" variant="primary" fullWidth disabled={loading}>
              {loading ? 'Bezig met inloggen...' : 'Inloggen'}
            </Button>

            <p className="text-center text-sm text-black">
              Nog geen account?{' '}
               <Link
                    href="/register"
                    className="font-semibold text-[#008080] underline underline-offset-4"
                >
                    Maak een account aan
                </Link>
            </p>
          </div>
        </form>
      </div>
    </main>
  )
}