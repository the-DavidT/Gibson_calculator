export function roundToOneDecimal(value: number): number {
  return Math.round((value + Number.EPSILON) * 10) / 10
}

export function formatOneDecimal(value: number): string {
  return roundToOneDecimal(value).toFixed(1)
}

export function formatThreeDecimals(value: number): string {
  return value.toFixed(3)
}
