const handleErrors = (errorResponse: any) => {
  // Reset errors array
  const errors: string[] = []

  // Log the entire error response for debugging
  console.error('Full error response:', errorResponse)
  console.error('Error data:', errorResponse?.data)

  // Check if the error response exists

  // Check if the error has a response from the server
  if (errorResponse) {
    const { status, data } = errorResponse
    console.error('Status:', status)
    console.error('Data details:', JSON.stringify(data, null, 2))

    // Handle different server error statuses

    // Check if data exists and is an object
    if (data && typeof data === 'object') {
      for (const field in data) {
        // Format error messages
        const errorValue = Array.isArray(data[field]) ? data[field].join(', ') : data[field]
        errors.push(`${field.replace(/_/g, ' ')}: ${errorValue}`)
      }
    } else {
      // Non-object response (e.g., string or other) - try to use backend-provided message
      const msg = (typeof data === 'string' && data) || data?.message || data?.error || errorResponse?.message || response?.message
      if (msg) {
        errors.push(String(msg))
      } else {
        errors.push('Unexpected server response format.')
      }
    }
  }
  return errors
}

export default handleErrors
