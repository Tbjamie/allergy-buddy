import Link from 'next/link'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary: 'bg-foreground text-white hover:bg-black',
  outline: 'border border-foreground/15 bg-white text-foreground hover:bg-foreground/5',
  ghost: 'bg-transparent text-foreground hover:bg-foreground/5',
  danger: 'bg-red text-white hover:bg-red/90',
}

function getButtonClasses({
  variant = 'primary',
  fullWidth = false,
  className = '',
}: {
  variant?: ButtonVariant
  fullWidth?: boolean
  className?: string
}) {
  return [
    'inline-flex py-4 items-center justify-center rounded-[14px] px-4 text-sm font-bold',
    'transition-colors duration-200',
    'disabled:cursor-not-allowed disabled:opacity-60',
    variantClasses[variant],
    fullWidth ? 'w-full' : '',
    className,
  ].join(' ')
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  fullWidth?: boolean
}

export default function Button({
  children,
  variant = 'primary',
  fullWidth = false,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={getButtonClasses({ variant, fullWidth, className })}
      {...props}
    >
      {children}
    </button>
  )
}

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
  children: ReactNode
  variant?: ButtonVariant
  fullWidth?: boolean
}

export function ButtonLink({
  href,
  children,
  variant = 'primary',
  fullWidth = false,
  className = '',
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={getButtonClasses({ variant, fullWidth, className })}
      {...props}
    >
      {children}
    </Link>
  )
}