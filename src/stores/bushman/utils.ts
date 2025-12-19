export const sleep = (ms = 0) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Validation */
export const validators = {
  email: (v: string) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(v as any) || 'Please enter a valid email address'
  },

  required: (v: any) => !!v || 'This field is required',

  tell: (v: string) => {
    const pattern = /^\+(\d{1,3})\s?(\d{1,4})?[\s.-]?(\d{1,4})[\s.-]?(\d{1,9})$/
    // Explanation of the pattern:
    // ^\+               : starts with +
    // (\d{1,3})        : country code (1 to 3 digits)
    // \s?              : optional space
    // (\d{1,4})?       : optional area code (1 to 4 digits)
    // [\s.-]?          : optional space, dot, or dash
    // (\d{1,4})        : first part of the local number (1 to 4 digits)
    // [\s.-]?          : optional space, dot, or dash
    // (\d{1,9})        : second part of the local number (1 to 9 digits)
    // $                : end of the string

    return pattern.test(v as any) || 'Please enter a valid international phone number'
  },
}

export const formatDateTime = (datetimeStr: string): string => {
  // Parse the string into a Date object
  const date = new Date(datetimeStr)

  // Check if the date is invalid
  if (isNaN(date.getTime())) {
    return 'Error parsing date'
  }

  // Define options for formatting to include only date components
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }

  // Format the date to a human-readable string
  return date.toLocaleDateString('en-US', options) // Use toLocaleDateString to avoid time info
}
