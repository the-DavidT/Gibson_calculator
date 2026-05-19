import { readFileSync } from 'node:fs'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the default stepwise calculator state', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'Gibson Assembly Calculator' })
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Final DNA volume')).toHaveValue(2.5)
    expect(screen.getByLabelText('Max DNA input volume')).toHaveValue(2.5)
    expect(screen.getByLabelText('Insert excess ratio')).toHaveValue(3)
    expect(screen.getByText('Final pipetting mix')).toBeInTheDocument()
    expect(screen.getAllByText('Backbone 1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Insert 1').length).toBeGreaterThan(0)
  })

  it('adds insert rows', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Add insert' }))

    expect(screen.getAllByLabelText('Insert name')).toHaveLength(2)
  })

  it('shows inline validation for missing required part values', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.clear(screen.getAllByLabelText('Backbone length bp')[0])

    expect(screen.getAllByText('Backbone 1 needs a length in bp.').length).toBeGreaterThan(0)
  })

  it('renders print worksheet actions and content', () => {
    render(<App />)

    expect(screen.getByRole('button', { name: 'Print worksheet' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save PDF' })).toBeInTheDocument()
    expect(screen.getByText('Gibson Assembly Reaction Worksheet')).toBeInTheDocument()
  })

  it('does not uppercase the µL result table header', () => {
    const stylesheet = readFileSync('src/renderer/src/styles.css', 'utf-8')

    expect(stylesheet).not.toMatch(/\bth\s*\{[^}]*text-transform:\s*uppercase/is)
  })
})
