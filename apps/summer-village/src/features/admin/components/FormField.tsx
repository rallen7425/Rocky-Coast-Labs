import { ReactNode } from 'react'

export const inputClass =
  'w-full rounded-xl px-4 py-3 font-body text-[14px] text-gray-900 border border-gray-200 outline-none focus:border-blue-400'
export const textareaClass = `${inputClass} resize-none`

interface FormFieldProps {
  label: string
  required?: boolean
  className?: string
  children: ReactNode
}

export function FormField({ label, required, className, children }: FormFieldProps) {
  return (
    <div className={className}>
      <label className="block font-body text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
        {label}
        {required && ' *'}
      </label>
      {children}
    </div>
  )
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p className="font-body text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
      {message}
    </p>
  )
}
