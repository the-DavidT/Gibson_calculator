import { describe, expect, it } from 'vitest'
import {
  calculateGibson,
  defaultReactionSettings,
  formatOneDecimal,
  formatThreeDecimals,
  pmolPerUl
} from './gibson'

const backbone = {
  id: 'backbone-1',
  name: 'Backbone',
  lengthBp: 5000,
  concentrationNgPerUl: 50
}

const insert = {
  id: 'insert-1',
  name: 'Insert',
  lengthBp: 1000,
  concentrationNgPerUl: 20
}

describe('pmolPerUl', () => {
  it('uses the dsDNA shortcut concentration / (length x 0.65)', () => {
    expect(pmolPerUl(50, 5000)).toBeCloseTo(0.0153846, 6)
  })
})

describe('calculateGibson', () => {
  it('fills the max DNA input volume with a 3x insert molar excess by default', () => {
    const result = calculateGibson({
      settings: defaultReactionSettings,
      backbones: [backbone],
      inserts: [insert]
    })

    expect(result.kind).toBe('ok')

    if (result.kind !== 'ok') {
      throw new Error('Expected valid calculation')
    }

    expect(result.parts).toHaveLength(2)
    expect(result.parts[0].targetPmol).toBeCloseTo(0.0153846, 6)
    expect(result.parts[0].volumeUl).toBeCloseTo(1.0, 6)
    expect(result.parts[0].weightNg).toBeCloseTo(50.0, 6)
    expect(result.parts[1].targetPmol).toBeCloseTo(0.0461538, 6)
    expect(result.parts[1].volumeUl).toBeCloseTo(1.5, 6)
    expect(result.parts[1].weightNg).toBeCloseTo(30.0, 6)
    expect(result.totalBackbonePmol).toBeCloseTo(0.0153846, 6)
    expect(result.totalInsertPmol).toBeCloseTo(0.0461538, 6)
    expect(result.totalDnaVolumeUl).toBeCloseTo(2.5, 6)
    expect(result.upwVolumeUl).toBeCloseTo(0, 6)
    expect(result.totalReactionVolumeUl).toBeCloseTo(10.0, 6)
  })

  it('splits total insert target pmol equally across multiple inserts', () => {
    const result = calculateGibson({
      settings: defaultReactionSettings,
      backbones: [backbone],
      inserts: [
        { ...insert, id: 'insert-1', name: 'Insert 1' },
        { ...insert, id: 'insert-2', name: 'Insert 2', lengthBp: 1500, concentrationNgPerUl: 30 }
      ]
    })

    expect(result.kind).toBe('ok')

    if (result.kind !== 'ok') {
      throw new Error('Expected valid calculation')
    }

    const inserts = result.parts.filter((part) => part.role === 'insert')
    expect(inserts).toHaveLength(2)
    expect(inserts[0].targetPmol).toBeCloseTo(inserts[1].targetPmol, 6)
    expect(inserts[0].targetPmol + inserts[1].targetPmol).toBeCloseTo(
      3 * result.totalBackbonePmol,
      6
    )
  })

  it('assigns equal target pmol to multiple backbone parts', () => {
    const result = calculateGibson({
      settings: defaultReactionSettings,
      backbones: [
        backbone,
        { ...backbone, id: 'backbone-2', name: 'Backbone 2', lengthBp: 3000, concentrationNgPerUl: 40 }
      ],
      inserts: [insert]
    })

    expect(result.kind).toBe('ok')

    if (result.kind !== 'ok') {
      throw new Error('Expected valid calculation')
    }

    const backbones = result.parts.filter((part) => part.role === 'backbone')
    expect(backbones).toHaveLength(2)
    expect(backbones[0].targetPmol).toBeCloseTo(backbones[1].targetPmol, 6)
  })

  it('adds UPW only when max DNA input volume is below the final DNA volume', () => {
    const result = calculateGibson({
      settings: { ...defaultReactionSettings, maxDnaInputVolumeUl: 2.4 },
      backbones: [backbone],
      inserts: [insert]
    })

    expect(result.kind).toBe('ok')

    if (result.kind !== 'ok') {
      throw new Error('Expected valid calculation')
    }

    expect(result.totalDnaVolumeUl).toBeCloseTo(2.4, 6)
    expect(result.upwVolumeUl).toBeCloseTo(0.1, 6)
  })

  it('returns validation errors for missing parts and impossible settings', () => {
    const result = calculateGibson({
      settings: { ...defaultReactionSettings, maxDnaInputVolumeUl: 2.6 },
      backbones: [],
      inserts: [{ ...insert, lengthBp: 0 }]
    })

    expect(result.kind).toBe('invalid')

    if (result.kind !== 'invalid') {
      throw new Error('Expected invalid calculation')
    }

    expect(result.errors).toContain('Add at least one backbone part.')
    expect(result.errors).toContain('Insert 1 needs a length in bp.')
    expect(result.errors).toContain('Max DNA input volume cannot exceed final DNA volume.')
  })

  it('warns when calculated volumes are below the pipetting threshold', () => {
    const result = calculateGibson({
      settings: defaultReactionSettings,
      backbones: [{ ...backbone, concentrationNgPerUl: 1000 }],
      inserts: [{ ...insert, concentrationNgPerUl: 1 }]
    })

    expect(result.kind).toBe('ok')

    if (result.kind !== 'ok') {
      throw new Error('Expected valid calculation')
    }

    expect(result.warnings.some((warning) => warning.includes('below 0.5 µL'))).toBe(true)
  })

  it('does not warn when the displayed volume rounds to the pipetting threshold', () => {
    const result = calculateGibson({
      settings: defaultReactionSettings,
      backbones: [{ ...backbone, concentrationNgPerUl: 140 }],
      inserts: [insert]
    })

    expect(result.kind).toBe('ok')

    if (result.kind !== 'ok') {
      throw new Error('Expected valid calculation')
    }

    const roundedBackboneVolume = formatOneDecimal(result.parts[0].volumeUl)

    expect(result.parts[0].volumeUl).toBeLessThan(defaultReactionSettings.pipettingWarningThresholdUl)
    expect(roundedBackboneVolume).toBe('0.5')
    expect(result.warnings.some((warning) => warning.includes('below 0.5 µL'))).toBe(false)
  })
})

describe('formatting helpers', () => {
  it('formats practical quantities to one decimal and pmol to three decimals', () => {
    expect(formatOneDecimal(2.44)).toBe('2.4')
    expect(formatOneDecimal(2.45)).toBe('2.5')
    expect(formatThreeDecimals(0.0153846)).toBe('0.015')
  })
})
