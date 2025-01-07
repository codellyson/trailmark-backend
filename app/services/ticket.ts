export async function generateTicketNumber(): Promise<string> {
  // Generate a random 8-character alphanumeric string
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const ticketLength = 8
  let result = ''

  for (let i = 0; i < ticketLength; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }

  return result
}
