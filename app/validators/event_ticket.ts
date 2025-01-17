import vine from '@vinejs/vine'

// Base ticket schema
export const eventTicketSchema = vine.object({
  name: vine.string(),
  description: vine.string().optional(),
  type: vine.enum(['general', 'vip', 'early_bird']),
  price: vine.number(),
  currency: vine.string(),
  currency_symbol: vine.string(),
  capacity: vine.number().optional(),
  status: vine.enum(['draft', 'active', 'sold_out', 'expired']).optional(),
  event_id: vine.number(),
  sales_end_date: vine.string(),
  sales_start_date: vine.string(),
})

// Create ticket validator
export const createEventTicketValidator = vine.compile(
  vine.object({
    data: vine.array(eventTicketSchema),
  })
)

// Update ticket validator
export const updateEventTicketValidator = vine.compile(
  vine.object({
    data: vine
      .object({
        id: vine.number(),
        ...eventTicketSchema.getProperties(),
      })
      .optional(),
  })
)

export const updateEventTicketStatusValidator = vine.compile(
  vine.object({
    status: vine.enum(['draft', 'active', 'sold_out', 'expired']),
  })
)
