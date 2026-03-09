export const toTitleCase = (input: string | null | undefined): string => {
  if (!input) return ''
  const str = input.toString().toLowerCase()
  // Capitalize first letter of each word, including after hyphens and apostrophes
  return str.replace(/\b\w/g, (c) => c.toUpperCase())
}
