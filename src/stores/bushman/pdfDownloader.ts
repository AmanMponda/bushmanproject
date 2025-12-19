const downloadPdf = async (base64OrUrl: string, filename = 'price-list-report.pdf') => {
  if (!base64OrUrl) {
    // eslint-disable-next-line no-console
    console.warn('downloadPdf: no data provided')
    return
  }

  try {
    // If value looks like a URL, fetch it as blob and download
    if (typeof base64OrUrl === 'string' && /^https?:\/\//i.test(base64OrUrl)) {
      const res = await fetch(base64OrUrl)
      if (!res.ok) {
        console.error(`Failed to fetch PDF from URL (status ${res.status})`)
        throw new Error(
          `Failed to fetch PDF from URL (status ${res.status}). The PDF may not be generated yet or the server encountered an error.`,
        )
      }
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(objectUrl)
      return
    }

    // If it contains a data: prefix, strip it
    const cleaned = (base64OrUrl || '').replace(/^data:application\/pdf;base64,/, '')

    // Try to detect HTML payload (some backends return HTML reports encoded as base64)
    let decoded: string | null = null
    try {
      decoded = atob(cleaned)
    } catch (e) {
      // atob can throw on huge payloads or non-base64 — we'll fallback to treating as base64 without decoding check
      decoded = null
    }

    if (decoded && (decoded.includes('<!DOCTYPE') || decoded.includes('<html'))) {
      // HTML content - download as .html
      const blob = new Blob([decoded], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename.replace(/\.pdf$/i, '.html')
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      return
    }

    // Otherwise assume PDF base64. Convert to byte array in chunks to avoid memory spikes
    const b64 = cleaned
    const sliceSize = 1024
    const byteArrays: Uint8Array[] = []
    for (let offset = 0; offset < b64.length; offset += sliceSize) {
      const slice = b64.slice(offset, offset + sliceSize)
      const byteChars = atob(slice)
      const byteNumbers = new Array(byteChars.length)
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      byteArrays.push(byteArray)
    }

    const blob = new Blob(byteArrays as BlobPart[], { type: 'application/pdf' })
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(objectUrl)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('downloadPdf error:', err)
  }
}

export default downloadPdf
