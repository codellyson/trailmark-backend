import  QRCode from 'qrcode'

interface QRCodeOptions {
  width?: number
  margin?: number
  color?: {
    dark: string
    light: string
  }
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
}

/**
 * Generate a QR code for the given text
 */
export async function generateQRCode(
  text: string,
  options: QRCodeOptions = {}
): Promise<{ dataUrl: string; svg: string }> {
  const defaultOptions: QRCodeOptions = {
    width: 300,
    margin: 4,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  }

  const mergedOptions = { ...defaultOptions, ...options }

  try {
    // Generate QR code as data URL (PNG)
    const dataUrl = await QRCode.toDataURL(text, {
      width: mergedOptions.width,
      margin: mergedOptions.margin,
      color: mergedOptions.color,
      errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
    })

    // Generate QR code as SVG
    const svg = await QRCode.toString(text, {
      type: 'svg',
      width: mergedOptions.width,
      margin: mergedOptions.margin,
      color: mergedOptions.color,
      errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
    })

    return {
      dataUrl,
      svg,
    }
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}
