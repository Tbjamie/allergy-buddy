'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
  match?: string[]
}

const navItems: NavItem[] = [
  {
    href: '/',
    label: 'Home',
    match: ['/'],
    icon: <HomeIcon className="h-6 w-6" />,
  },
  {
    href: '/facts',
    label: 'Facts',
    match: ['/facts'],
    icon: <FactsIcon className="h-6 w-6" />,
  },
  {
    href: '/order-help',
    label: 'Order help',
    match: ['/order-help'],
    icon: <OrderHelpIcon className="h-6 w-6" />,
  },
  {
    href: '/sos',
    label: 'SOS',
    match: ['/sos', '/emergency'],
    icon: <SosIcon className="h-6 w-6" />,
  },
  {
    href: '/account',
    label: 'Account',
    match: ['/account', '/profile'],
    icon: <AccountIcon className="h-6 w-6" />,
  },
]

export default function BottomNavigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2.5rem)] max-w-md -translate-x-1/2 rounded-2xl bg-foreground px-4 py-3 shadow-2xl">
      <ul className="grid grid-cols-5 items-center">
        {navItems.map((item) => {
          const isActive =
            item.match?.some((path) => {
              if (path === '/') return pathname === '/'
              return pathname.startsWith(path)
            }) ?? false

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-label={item.label}
                className={[
                  'flex flex-col items-center justify-center gap-1 rounded-xl py-1 text-[11px] font-bold transition-colors',
                  isActive ? 'text-white' : 'text-white/65 hover:text-white',
                ].join(' ')}
              >
                <span
                  className={[
                    'flex h-7 items-center justify-center transition-transform',
                    isActive ? 'scale-105' : 'scale-100',
                  ].join(' ')}
                >
                  {item.icon}
                </span>

                <span className="leading-none">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function HomeIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M3 10.8L12 3l9 7.8V21a1 1 0 0 1-1 1h-5.5v-6.5h-5V22H4a1 1 0 0 1-1-1V10.8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function FactsIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M6 3h9l3 3v15H6V3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M15 3v4h4M9 11h6M9 15h6M9 19h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function OrderHelpIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M7 3v8M12 3v8M17 3v8M5 11h14M8 11v10M16 11v10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M20 14.5c0 2.5-2 4.5-4.5 4.5H15v-9h.5c2.5 0 4.5 2 4.5 4.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SosIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7V3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function AccountIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M4 21c.8-4.2 3.8-6.5 8-6.5s7.2 2.3 8 6.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}