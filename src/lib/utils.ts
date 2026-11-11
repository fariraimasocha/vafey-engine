import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Public URL for an image stored in R2 (served by src/routes/api/images/$.ts). */
export const imageUrl = (key: string) => `/api/images/${key}`
