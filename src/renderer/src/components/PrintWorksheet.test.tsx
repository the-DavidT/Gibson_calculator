import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { calculateGibson, defaultReactionSettings } from '../lib/gibson'
import { PrintWorksheet } from './PrintWorksheet'

const result = calculateGibson({
  settings: defaultReactionSettings,
  backbones: [
    {
      id: 'backbone-1',
      name: 'Backbone 1',
      lengthBp: 5000,
      concentrationNgPerUl: 50
    }
  ],
  inserts: [
    {
      id: 'insert-1',
      name: 'Insert 1',
      lengthBp: 1000,
      concentrationNgPerUl: 20
    }
  ]
})

describe('PrintWorksheet', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 4, 9))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('prints the date in European day/month/year format', () => {
    render(<PrintWorksheet result={result} reactionName="Assembly test" />)

    expect(screen.getByText('09/05/2026')).toBeInTheDocument()
  })

  it('marks the total reaction row for print highlighting', () => {
    render(<PrintWorksheet result={result} reactionName="Assembly test" />)

    const totalLabel = screen.getByText('Total reaction')

    expect(totalLabel.closest('tr')).toHaveClass('print-total-row')
  })
})
