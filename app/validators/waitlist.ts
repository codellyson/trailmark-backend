import vine from '@vinejs/vine'

export const waitlistValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    business_name: vine.string(),
    role: vine.enum(['vendor', 'organizer', 'attendee']),
  })
)
