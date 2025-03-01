import { randomBytes } from 'node:crypto'

export function generateTicketNumber(): string {
  const timestamp = Date.now().toString(36)
  const random = randomBytes(4).toString('hex')
  return `TKT-${timestamp}-${random}`.toUpperCase()
}

export function generateQRCode(): string {
  // For now, we'll just generate a unique string that will be used to generate QR code
  // In a real implementation, this would generate an actual QR code or a unique identifier
  // that can be used to generate a QR code on demand
  const timestamp = Date.now().toString(36)
  const random = randomBytes(8).toString('hex')
  return `${timestamp}${random}`
}
