import { formatOneDecimal, formatThreeDecimals } from './format'

export type DnaRole = 'backbone' | 'insert'

export interface DnaPartInput {
  id: string
  name: string
  lengthBp: number
  concentrationNgPerUl: number
}

export interface ReactionSettings {
  finalDnaVolumeUl: number
  maxDnaInputVolumeUl: number
  gibsonMixVolumeUl: number
  insertExcessRatio: number
  pipettingWarningThresholdUl: number
}

export interface CalculatedPart extends DnaPartInput {
  role: DnaRole
  pmolPerUl: number
  targetPmol: number
  volumeUl: number
  weightNg: number
}

export interface GibsonOkResult {
  kind: 'ok'
  settings: ReactionSettings
  parts: CalculatedPart[]
  warnings: string[]
  totalBackbonePmol: number
  totalInsertPmol: number
  totalDnaPmol: number
  totalBackboneWeightNg: number
  totalDnaVolumeUl: number
  upwVolumeUl: number
  totalReactionVolumeUl: number
}

export interface GibsonInvalidResult {
  kind: 'invalid'
  errors: string[]
}

export type GibsonResult = GibsonOkResult | GibsonInvalidResult

export const defaultReactionSettings: ReactionSettings = {
  finalDnaVolumeUl: 2.5,
  maxDnaInputVolumeUl: 2.5,
  gibsonMixVolumeUl: 7.5,
  insertExcessRatio: 3.0,
  pipettingWarningThresholdUl: 0.5
}

export { formatOneDecimal, formatThreeDecimals }

export function pmolPerUl(concentrationNgPerUl: number, lengthBp: number): number {
  return concentrationNgPerUl / (lengthBp * 0.65)
}

export function calculateGibson({
  settings,
  backbones,
  inserts
}: {
  settings: ReactionSettings
  backbones: DnaPartInput[]
  inserts: DnaPartInput[]
}): GibsonResult {
  const errors = validateInputs(settings, backbones, inserts)

  if (errors.length > 0) {
    return { kind: 'invalid', errors }
  }

  const backbonePmolPerUl = backbones.map((part) =>
    pmolPerUl(part.concentrationNgPerUl, part.lengthBp)
  )
  const insertPmolPerUl = inserts.map((part) => pmolPerUl(part.concentrationNgPerUl, part.lengthBp))

  const backboneVolumeFactor = sum(backbonePmolPerUl.map((value) => 1 / value))
  const insertVolumeFactor = sum(insertPmolPerUl.map((value) => 1 / value))
  const insertTargetPerBackbonePmol = (settings.insertExcessRatio * backbones.length) / inserts.length
  const totalVolumeFactor = backboneVolumeFactor + insertTargetPerBackbonePmol * insertVolumeFactor
  const backboneTargetPmol = settings.maxDnaInputVolumeUl / totalVolumeFactor
  const insertTargetPmol = (settings.insertExcessRatio * backbones.length * backboneTargetPmol) / inserts.length

  const calculatedBackbones = backbones.map((part, index): CalculatedPart => {
    const partPmolPerUl = backbonePmolPerUl[index]
    const volumeUl = backboneTargetPmol / partPmolPerUl

    return {
      ...part,
      role: 'backbone',
      pmolPerUl: partPmolPerUl,
      targetPmol: backboneTargetPmol,
      volumeUl,
      weightNg: volumeUl * part.concentrationNgPerUl
    }
  })

  const calculatedInserts = inserts.map((part, index): CalculatedPart => {
    const partPmolPerUl = insertPmolPerUl[index]
    const volumeUl = insertTargetPmol / partPmolPerUl

    return {
      ...part,
      role: 'insert',
      pmolPerUl: partPmolPerUl,
      targetPmol: insertTargetPmol,
      volumeUl,
      weightNg: volumeUl * part.concentrationNgPerUl
    }
  })

  const parts = [...calculatedBackbones, ...calculatedInserts]
  const totalDnaVolumeUl = sum(parts.map((part) => part.volumeUl))
  const totalBackbonePmol = sum(calculatedBackbones.map((part) => part.targetPmol))
  const totalInsertPmol = sum(calculatedInserts.map((part) => part.targetPmol))
  const totalBackboneWeightNg = sum(calculatedBackbones.map((part) => part.weightNg))
  const totalDnaPmol = totalBackbonePmol + totalInsertPmol
  const upwVolumeUl = Math.max(0, settings.finalDnaVolumeUl - totalDnaVolumeUl)

  return {
    kind: 'ok',
    settings,
    parts,
    warnings: buildWarnings({
      parts,
      settings,
      totalBackboneWeightNg,
      totalDnaPmol
    }),
    totalBackbonePmol,
    totalInsertPmol,
    totalDnaPmol,
    totalBackboneWeightNg,
    totalDnaVolumeUl,
    upwVolumeUl,
    totalReactionVolumeUl: settings.gibsonMixVolumeUl + settings.finalDnaVolumeUl
  }
}

function validateInputs(
  settings: ReactionSettings,
  backbones: DnaPartInput[],
  inserts: DnaPartInput[]
): string[] {
  const errors: string[] = []

  if (backbones.length === 0) {
    errors.push('Add at least one backbone part.')
  }

  if (inserts.length === 0) {
    errors.push('Add at least one insert part.')
  }

  if (!isPositive(settings.finalDnaVolumeUl)) {
    errors.push('Final DNA volume must be greater than 0.0 µL.')
  }

  if (!isPositive(settings.maxDnaInputVolumeUl)) {
    errors.push('Max DNA input volume must be greater than 0.0 µL.')
  }

  if (settings.maxDnaInputVolumeUl > settings.finalDnaVolumeUl) {
    errors.push('Max DNA input volume cannot exceed final DNA volume.')
  }

  if (!isPositive(settings.gibsonMixVolumeUl)) {
    errors.push('Gibson mix volume must be greater than 0.0 µL.')
  }

  if (!isPositive(settings.insertExcessRatio)) {
    errors.push('Insert excess ratio must be greater than 0.0x.')
  }

  if (!isPositive(settings.pipettingWarningThresholdUl)) {
    errors.push('Pipetting warning threshold must be greater than 0.0 µL.')
  }

  backbones.forEach((part, index) => {
    errors.push(...validatePart(part, 'Backbone', index))
  })

  inserts.forEach((part, index) => {
    errors.push(...validatePart(part, 'Insert', index))
  })

  return errors
}

function validatePart(part: DnaPartInput, label: string, index: number): string[] {
  const partLabel = `${label} ${index + 1}`
  const errors: string[] = []

  if (!part.name.trim()) {
    errors.push(`${partLabel} needs a name.`)
  }

  if (!isPositive(part.lengthBp)) {
    errors.push(`${partLabel} needs a length in bp.`)
  }

  if (!isPositive(part.concentrationNgPerUl)) {
    errors.push(`${partLabel} needs a concentration in ng/µL.`)
  }

  return errors
}

function buildWarnings({
  parts,
  settings,
  totalBackboneWeightNg,
  totalDnaPmol
}: {
  parts: CalculatedPart[]
  settings: ReactionSettings
  totalBackboneWeightNg: number
  totalDnaPmol: number
}): string[] {
  const warnings: string[] = []

  parts.forEach((part) => {
    if (part.volumeUl < settings.pipettingWarningThresholdUl) {
      warnings.push(
        `${part.name} volume is below ${formatOneDecimal(settings.pipettingWarningThresholdUl)} µL.`
      )
    }
  })

  if (totalBackboneWeightNg < 50 || totalBackboneWeightNg > 100) {
    warnings.push(
      `Total backbone mass is ${formatOneDecimal(totalBackboneWeightNg)} ng; protocol guidance is 50.0-100.0 ng.`
    )
  }

  if (parts.length <= 2 && (totalDnaPmol < 0.02 || totalDnaPmol > 0.5)) {
    warnings.push(
      `Total DNA is ${formatThreeDecimals(totalDnaPmol)} pmol; protocol guidance for 1-2 DNA fragments is 0.020-0.500 pmol.`
    )
  }

  if (parts.length >= 4 && parts.length <= 6 && (totalDnaPmol < 0.2 || totalDnaPmol > 1.0)) {
    warnings.push(
      `Total DNA is ${formatThreeDecimals(totalDnaPmol)} pmol; protocol guidance for 4-6 DNA fragments is 0.200-1.000 pmol.`
    )
  }

  return warnings
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

function isPositive(value: number): boolean {
  return Number.isFinite(value) && value > 0
}
