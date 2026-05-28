'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import ArrowIcon from '@/components/icons/ArrowIcon'
import Link from 'next/link'

export default function RegisterForm() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleRegister(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    setErrorMessage(null)

    if (password !== passwordConfirm) {
      setErrorMessage('De wachtwoorden komen niet overeen.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          first_name: fullName.split(' ')[0] || '',
          last_name:
            fullName.trim().split(/\s+/).length > 1
              ? fullName.trim().split(/\s+/)[fullName.trim().split(/\s+/).length - 1]
              : '',
        },
      },
    })

    setLoading(false)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    router.push('/onboarding')
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
          <h1 className="text-[30px] font-black text-[#008080]">Registreren</h1>
          <p className="mt-3 text-[30px] leading-tight text-[#111827]">Maak een account!</p>
        </section>

        <form onSubmit={handleRegister} className="mt-16 flex flex-1 flex-col">
          <div className="space-y-5">
            <div>
              <label htmlFor="fullName" className="mb-2 block text-sm font-bold text-[#111827]">
                Naam
              </label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Naam"
                className="h-14.5 w-full rounded-xl border border-gray-300 px-4 text-sm text-[#111827] outline-none placeholder:text-gray-300 focus:border-[#008080]"
              />
            </div>

            <div>
              <label htmlFor="registerEmail" className="mb-2 block text-sm font-bold text-[#111827]">
                E-mail
              </label>
              <input
                id="registerEmail"
                autoComplete="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="E-mailadres"
                className="h-14.5 w-full rounded-xl border border-gray-300 px-4 text-sm text-[#111827] outline-none placeholder:text-gray-300 focus:border-[#008080]"
              />
            </div>

            <div>
  <label
    htmlFor="registerPassword"
    className="mb-2 block text-sm font-bold text-[#111827]"
  >
    Wachtwoord
  </label>

  <div className="relative">
    <input
      id="registerPassword"
      type={showPassword ? 'text' : 'password'}
      required
      value={password}
      onChange={(event) => setPassword(event.target.value)}
      autoComplete="new-password"
      placeholder="••••••••••••"
      className="h-14.5 w-full rounded-xl border border-gray-300 px-4 pr-12 text-sm text-[#111827] outline-none placeholder:text-gray-300 focus:border-[#008080]"
    />

    <PasswordToggleButton
      showPassword={showPassword}
      onClick={() => setShowPassword((value) => !value)}
      label={showPassword ? 'Wachtwoord verbergen' : 'Wachtwoord tonen'}
    />
  </div>
</div>

<div>
  <label
    htmlFor="passwordConfirm"
    className="mb-2 block text-sm font-bold text-[#111827]"
  >
    Bevestig Wachtwoord
  </label>

  <div className="relative">
    <input
      id="passwordConfirm"
      type={showPasswordConfirm ? 'text' : 'password'}
      required
      value={passwordConfirm}
      autoComplete="new-password"
      onChange={(event) => setPasswordConfirm(event.target.value)}
      placeholder="••••••••••••"
      className="h-14.5 w-full rounded-xl border border-gray-300 px-4 pr-12 text-sm text-[#111827] outline-none placeholder:text-gray-300 focus:border-[#008080]"
    />

    <PasswordToggleButton
      showPassword={showPasswordConfirm}
      onClick={() => setShowPasswordConfirm((value) => !value)}
      label={
        showPasswordConfirm
          ? 'Bevestiging wachtwoord verbergen'
          : 'Bevestiging wachtwoord tonen'
      }
    />
  </div>
</div>

            {errorMessage && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {errorMessage}
              </div>
            )}
          </div>

          <div className="mt-auto space-y-5 pt-12">
            <Button type="submit" variant="primary" fullWidth disabled={loading}>
              {loading ? 'Account aanmaken...' : 'Maak account aan'}
            </Button>

            <p className="text-center text-sm text-black">
              Heb je al een account?{' '}
              <Link
                    href="/login"
                    className="font-semibold text-[#008080] underline underline-offset-4"
                >
                    Inloggen
            </Link>
            </p>
          </div>
        </form>
      </div>
    </main>
  )

  function PasswordToggleButton({
  showPassword,
  onClick,
  label,
}: {
  showPassword: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center justify-center text-[#666A71] transition-colors hover:text-[#111827]"
      aria-label={label}
    >
      {showPassword ? (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M3 3L21 21"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M9.88 4.24A9.77 9.77 0 0 1 12 4c5 0 8.5 4 10 8a13.2 13.2 0 0 1-2.1 3.6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6.61 6.61C4.37 8.04 2.82 10.17 2 12c1.5 4 5 8 10 8a9.9 9.9 0 0 0 4.37-1.01"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M2 12C3.5 8 7 4 12 4s8.5 4 10 8c-1.5 4-5 8-10 8s-8.5-4-10-8Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      )}
    </button>
  )
}
}