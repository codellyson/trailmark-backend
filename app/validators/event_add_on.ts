import vine from '@vinejs/vine'

export const createEventAddOnValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(3),
    price: vine.number().min(0),
    eventId: vine.string().uuid(),
    description: vine.string().minLength(3),
    quantityAvailable: vine.number().min(0),
    type: vine.enum(['one_time', 'recurring']),
    capacity: vine.number().min(0),
    currency: vine.string(),
    currency_symbol: vine.string(),
    status: vine.enum(['active', 'sold_out']),
    photographerId: vine.string().uuid(),
    photo_count: vine.number().min(0),
  })
)
