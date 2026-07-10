import { ReactNode } from 'react'

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div
      className="font-body font-bold uppercase tracking-[0.09em] text-white/50 px-0.5 pb-1.5"
      style={{ fontSize: 10 }}
    >
      {children}
    </div>
  )
}
