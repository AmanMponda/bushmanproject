const handleErrors = (errorResponse: any) => {
  // Reset errors array
  const errors: string[] = []

  // Log the entire error response for debugging
  console.log('Full error response:', errorResponse)
  console.log('Error data:', errorResponse?.data)

  // Check if the error response exists

  // Check if the error has a response from the server
  if (errorResponse) {
    const { status, data } = errorResponse
    console.log('Status:', status)
    console.log('Data details:', JSON.stringify(data, null, 2))

    // Handle different server error statuses

    // Check if data exists and is an object
    if (data && typeof data === 'object') {
      for (const field in data) {
        // Format error messages
        const errorValue = Array.isArray(data[field]) ? data[field].join(', ') : data[field]
        errors.push(`${field.replace(/_/g, ' ')}: ${errorValue}`)
      }
    } else {
      errors.push('Unexpected server response format.')
    }
  }
  return errors
}

export default handleErrors
