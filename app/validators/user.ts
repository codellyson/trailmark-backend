import vine from '@vinejs/vine'

export const createUserValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    password: vine.string().trim().minLength(8),
    first_name: vine.string().trim().minLength(2),
    last_name: vine.string().trim().minLength(2),
    role: vine.enum(['user', 'photographer', 'organizer']), // Updated to include photographer
  })
)
