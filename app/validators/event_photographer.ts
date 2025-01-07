import vine from '@vinejs/vine'

export const createEventPhotographerValidator = vine.compile(
  vine.object({
    eventId: vine.number(),
    pricePerPerson: vine.number().min(0),
    photographerId: vine.number(),
  })
)

export const updateEventPhotographerStatusValidator = vine.compile(
  vine.object({
    id: vine.number(),
    status: vine.enum(['pending', 'confirmed', 'rejected']),
    pricePerPerson: vine.number().min(0),
  })
)
