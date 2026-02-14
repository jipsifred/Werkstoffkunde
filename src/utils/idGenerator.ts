import type { CardType } from '../types/card'

/**
 * Map of German umlauts and special characters to their ASCII replacements.
 * Used when generating topic abbreviations for card IDs.
 */
const UMLAUT_MAP: Record<string, string> = {
  'ä': 'A',
  'ö': 'O',
  'ü': 'U',
  'Ä': 'A',
  'Ö': 'O',
  'Ü': 'U',
  'ß': 'S',
}

/**
 * Map of CardType to the single-character initial used in IDs.
 */
const TYPE_INITIAL_MAP: Record<CardType, string> = {
  'Formel': 'F',
  'Definition': 'D',
  'Graph': 'G',
  'Erklärung': 'E',
}

/**
 * Generates a 3-character uppercase abbreviation from a topic name.
 * Handles German umlauts (ä->A, ö->O, ü->U, ß->S) and strips
 * non-alphabetic characters before taking the first 3 letters.
 *
 * @example
 *   getTopicAbbreviation("Zugversuch") => "ZUG"
 *   getTopicAbbreviation("Härteprüfung") => "HAR"
 *   getTopicAbbreviation("Wärmebehandlung") => "WAR"
 *   getTopicAbbreviation("Eisen-Kohlenstoff-Diagramm") => "EIS"
 */
export function getTopicAbbreviation(topic: string): string {
  const normalized = topic
    .split('')
    .map((char) => UMLAUT_MAP[char] ?? char)
    .join('')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()

  return normalized.slice(0, 3).padEnd(3, 'X')
}

/**
 * Returns the single-character initial for a given CardType.
 */
export function getTypeInitial(type: CardType): string {
  return TYPE_INITIAL_MAP[type]
}

/**
 * Generates a card ID in the format "ABC-X-001" where:
 * - ABC = first 3 uppercase letters of topic (umlauts replaced)
 * - X   = type initial (F/D/G/E)
 * - 001 = sequential number, zero-padded to 3 digits
 *
 * Scans existing IDs to find the next available sequence number
 * for the given topic+type combination.
 *
 * @param topic     The card's topic string
 * @param type      The card's type
 * @param existingIds  Array of all existing card IDs to avoid collisions
 * @returns         A unique card ID string
 */
export function generateCardId(
  topic: string,
  type: CardType,
  existingIds: string[],
): string {
  const abbreviation = getTopicAbbreviation(topic)
  const typeInitial = getTypeInitial(type)
  const prefix = `${abbreviation}-${typeInitial}-`

  // Find the highest existing sequence number for this prefix
  let maxNumber = 0
  for (const id of existingIds) {
    if (id.startsWith(prefix)) {
      const numPart = id.slice(prefix.length)
      const parsed = parseInt(numPart, 10)
      if (!isNaN(parsed) && parsed > maxNumber) {
        maxNumber = parsed
      }
    }
  }

  const nextNumber = maxNumber + 1
  const padded = nextNumber.toString().padStart(3, '0')
  return `${prefix}${padded}`
}
