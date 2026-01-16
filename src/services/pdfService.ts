import Swal from 'sweetalert2'

/**
 * Generic PDF download utility that handles base64 decoding and blob creation
 * @param base64Pdf - Base64 encoded PDF string
 * @param filename - Desired filename for download
 */
export const downloadPdfFromBase64 = (base64Pdf: string, filename: string) => {
  try {
    const byteCharacters = atob(base64Pdf)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error processing PDF:', error)
    throw error
  }
}

/**
 * Fetch and download a quotation PDF
 * @param pricingId - ID of the pricing/quotation
 * @returns Promise that resolves when download is complete
 */
export const downloadQuotationPdf = async (pricingId: string | number) => {
  if (!pricingId) {
    throw new Error('Pricing ID is required')
  }

  try {
    const response = await fetch(
      `${import.meta.env.VITE_APP_BASE_URL}sales-enquiries/pricing/${pricingId}/quotation-pdf`,
      { headers: { 'Content-Type': 'application/json' } }
    )

    const data = await response.json()
    if (data?.success && data?.pdf) {
      downloadPdfFromBase64(data.pdf, `quotation-${pricingId}.pdf`)
    } else {
      throw new Error(data?.message || 'Failed to generate quotation PDF')
    }
  } catch (error) {
    console.error('Error downloading quotation PDF:', error)
    throw error
  }
}

/**
 * Fetch and download an order PDF
 * @param orderId - ID of the order
 * @returns Promise that resolves when download is complete
 */
export const downloadOrderPdf = async (orderId: string | number) => {
  if (!orderId) {
    throw new Error('Order ID is required')
  }

  try {
    const response = await fetch(
      `${import.meta.env.VITE_APP_BASE_URL}orders/${orderId}/order-pdf`,
      { headers: { 'Content-Type': 'application/json' } }
    )

    const data = await response.json()
    if (data?.success && data?.pdf) {
      downloadPdfFromBase64(data.pdf, `order-${orderId}.pdf`)
    } else {
      throw new Error(data?.message || 'Failed to generate order PDF')
    }
  } catch (error) {
    console.error('Error downloading order PDF:', error)
    throw error
  }
}

/**
 * Fetch and download a contract PDF
 * @param contractId - ID of the contract
 * @param versionId - Optional version ID of the contract
 * @returns Promise that resolves when download is complete
 */
export const downloadContractPdf = async (contractId: string | number, versionId?: string | number) => {
  if (!contractId) {
    throw new Error('Contract ID is required')
  }

  try {
    const endpoint = versionId
      ? `${import.meta.env.VITE_APP_BASE_URL}contract-management/${contractId}/versions/${versionId}/contract-pdf`
      : `${import.meta.env.VITE_APP_BASE_URL}contract-management/${contractId}/contract-pdf`

    const response = await fetch(endpoint, {
      headers: { 'Content-Type': 'application/json' }
    })

    const data = await response.json()
    if (data?.success && data?.pdf) {
      downloadPdfFromBase64(data.pdf, `contract-${contractId}.pdf`)
    } else {
      throw new Error(data?.message || 'Failed to generate contract PDF')
    }
  } catch (error) {
    console.error('Error downloading contract PDF:', error)
    throw error
  }
}

/**
 * Wrapper to handle PDF download with error notification
 * @param downloadFn - Async function that downloads the PDF
 * @param errorMessage - Custom error message to display
 * @returns Promise that resolves when complete (success or error)
 */
export const handlePdfDownload = async (
  downloadFn: () => Promise<void>,
  errorMessage: string = 'Failed to download PDF'
) => {
  try {
    await downloadFn()
  } catch (error) {
    console.error(errorMessage, error)
    Swal.fire('Error', errorMessage, 'error')
  }
}
