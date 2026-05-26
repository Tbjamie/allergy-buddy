import type { SVGProps } from 'react'

type ArrowIconProps = SVGProps<SVGSVGElement>

export default function ArrowIcon(props: ArrowIconProps) {
  return (
    <svg
      viewBox="0 0 18 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M7.85714 14.7143L0.999999 7.85714L7.85714 1M1.57143 7.85714L17 7.85714"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}