const UMLAUT_MAP: Record<string, string> = {
  'ä': 'A', 'ö': 'O', 'ü': 'U',
  'Ä': 'A', 'Ö': 'O', 'Ü': 'U',
  'ß': 'S',
}

export function getTopicAbbreviation(topic: string): string {
  const normalized = topic
    .split('')
    .map((char) => UMLAUT_MAP[char] ?? char)
    .join('')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
  return normalized.slice(0, 3).padEnd(3, 'X')
}

export function getTypeInitial(type: string): string {
  const map: Record<string, string> = {
    'Formel': 'F', 'Definition': 'D', 'Graph': 'G', 'Erklärung': 'E',
  }
  return map[type] || type.charAt(0).toUpperCase()
}

export function generateCardId(topic: string, type: string, existingIds: string[]): string {
  const abbr = getTopicAbbreviation(topic)
  const initial = getTypeInitial(type)
  const prefix = `${abbr}-${initial}-`

  let max = 0
  for (const id of existingIds) {
    if (id.startsWith(prefix)) {
      const num = parseInt(id.slice(prefix.length), 10)
      if (!isNaN(num) && num > max) max = num
    }
  }

  return `${prefix}${(max + 1).toString().padStart(3, '0')}`
}
