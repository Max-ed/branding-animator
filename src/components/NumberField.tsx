import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import './NumberField.css'

interface NumberFieldProps {
  value: number | null
  onChange: (value: number | null) => void
  min: number
  max: number
  /** Arrow-key step; Shift multiplies it by 10. */
  step?: number
  /** Decimal places kept when a value is committed. */
  decimals?: number
  /** When true, clearing the field commits `null`. */
  allowEmpty?: boolean
  placeholder?: string
  suffix?: string
  className?: string
  title?: string
}

function format(value: number | null, decimals: number): string {
  if (value === null || !Number.isFinite(value)) return ''
  return String(Number(value.toFixed(decimals)))
}

function parse(text: string): number | null {
  const cleaned = text.trim().replace(',', '.')
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

/**
 * Text-based number input. While focused it keeps whatever you type as a draft
 * (no clamping per keystroke, so "150" can be typed through "1" and "15");
 * in-range values apply live, and the value is clamped on Enter or blur.
 * Escape reverts, ↑/↓ step (Shift ×10), and a comma works as decimal separator.
 */
export function NumberField({
  value,
  onChange,
  min,
  max,
  step = 1,
  decimals = 0,
  allowEmpty = false,
  placeholder,
  suffix,
  className,
  title,
}: NumberFieldProps) {
  const [draft, setDraft] = useState(() => format(value, decimals))
  const focused = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Follow outside changes (slider, loaded config) while the user isn't typing.
  useEffect(() => {
    if (!focused.current) setDraft(format(value, decimals))
  }, [value, decimals])

  function clampRound(n: number) {
    const clamped = Math.min(max, Math.max(min, n))
    return Number(clamped.toFixed(decimals))
  }

  function commit() {
    const n = parse(draft)
    if (n === null) {
      if (allowEmpty && draft.trim() === '') {
        onChange(null)
        setDraft('')
      } else {
        setDraft(format(value, decimals))
      }
      return
    }
    const next = clampRound(n)
    if (next !== value) onChange(next)
    setDraft(format(next, decimals))
  }

  function handleText(text: string) {
    setDraft(text)
    const n = parse(text)
    if (n !== null && n >= min && n <= max) onChange(Number(n.toFixed(decimals)))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      commit()
      inputRef.current?.select()
    } else if (e.key === 'Escape') {
      setDraft(format(value, decimals))
      inputRef.current?.blur()
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      const base = parse(draft) ?? value ?? min
      const delta = (e.key === 'ArrowUp' ? 1 : -1) * step * (e.shiftKey ? 10 : 1)
      const next = clampRound(base + delta)
      onChange(next)
      setDraft(format(next, decimals))
    }
  }

  return (
    <div className={`number-field ${className ?? ''}`} title={title}>
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => handleText(e.target.value)}
        onFocus={(e) => {
          focused.current = true
          e.target.select()
        }}
        onBlur={() => {
          focused.current = false
          commit()
        }}
        onKeyDown={handleKeyDown}
      />
      {suffix && <span className="number-field-suffix">{suffix}</span>}
    </div>
  )
}
