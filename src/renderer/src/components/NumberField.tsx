import { useId } from 'react'

interface NumberFieldProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  precision?: number
  integer?: boolean
  suffix?: string
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 0.1,
  precision = 1,
  integer = false,
  suffix
}: NumberFieldProps): JSX.Element {
  const id = useId()

  const displayValue = Number.isFinite(value) && value > 0 ? String(value) : ''

  function handleBlur(): void {
    if (!Number.isFinite(value) || value <= 0) {
      return
    }

    const minAdjusted = min === undefined ? value : Math.max(min, value)
    const clamped = max === undefined ? minAdjusted : Math.min(max, minAdjusted)
    const rounded = integer ? Math.round(clamped) : roundTo(clamped, precision)
    onChange(rounded)
  }

  return (
    <label className="field" htmlFor={id}>
      <span className="field-label">{label}</span>
      <span className="field-control">
        <input
          id={id}
          aria-label={label}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={integer ? 1 : step}
          value={displayValue}
          onBlur={handleBlur}
          onChange={(event) => {
            const next = event.currentTarget.value
            onChange(next === '' ? 0 : Number(next))
          }}
        />
        {suffix ? <span className="field-suffix">{suffix}</span> : null}
      </span>
    </label>
  )
}

function roundTo(value: number, precision: number): number {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}
