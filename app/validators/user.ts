import vine from '@vinejs/vine'

export const createUserValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    fullName: vine.string().trim().minLength(3).maxLength(255),
    password: vine.string().trim().minLength(8),
    role: vine.enum(['photographer', 'organizer', 'client']),
  })
)
