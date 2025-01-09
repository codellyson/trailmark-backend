import vine from '@vinejs/vine'

export const createEventTicketValidator = vine.compile(
  vine.object({
    name: vine.string(),
    description: vine.string().optional(),
    type: vine.string(),
    price: vine.number(),
    currency: vine.string(),
    currency_symbol: vine.string(),
    capacity: vine.number().optional(),
    status: vine.string().optional(),
    event_id: vine.number(),
  })
)
