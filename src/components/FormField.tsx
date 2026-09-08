import type { ChangeEvent, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

const inputClass =
  'w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text'

const labelClass = 'mb-[4px] block text-[12px] font-semibold text-text-3'

interface FieldProps {
  readonly label: ReactNode
  readonly children: ReactNode
  readonly className?: string
}

export function FormField({ label, children, className }: FieldProps) {
  return (
    <label className={`block ${className ?? ''}`}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  )
}

export function FormInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ''}`} />
}

export function FormSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClass} ${props.className ?? ''}`} />
}

export function FormTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClass} min-h-[80px] resize-y ${props.className ?? ''}`} />
}

export function FormCheckbox({
  label,
  checked,
  onChange,
}: {
  readonly label: ReactNode
  readonly checked: boolean
  readonly onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-center gap-[8px]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-border bg-surface text-accent"
      />
      <span className="text-[13px] text-text">{label}</span>
    </label>
  )
}
