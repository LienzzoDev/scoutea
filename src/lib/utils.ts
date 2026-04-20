import { Decimal } from '@prisma/client/runtime/library'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert Prisma Decimal to number (or null if input is null/undefined)
 */
export function decimalToNumber(value: Decimal | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null
  }
  return value.toNumber()
}

/**
 * Convert Prisma Decimal to number with a default value if null/undefined
 */
export function decimalToNumberOrDefault(value: Decimal | null | undefined, defaultValue: number): number {
  if (value === null || value === undefined) {
    return defaultValue
  }
  return value.toNumber()
}