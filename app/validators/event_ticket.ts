import vine from '@vinejs/vine'

// Base ticket schema
export const eventTicketSchema = vine.object({
  name: vine.string(),
  price: vine.number(),
  capacity: vine.number(),
  type: vine.string(),
  is_group_ticket: vine.boolean(),
  group_size: vine.number(),
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
        ...eventTicketSchema.getProperties(),
      })
      .optional(),
  })
)

export const updateEventTicketStatusValidator = vine.compile(
  vine.object({
    status: vine.enum(['valid', 'used', 'cancelled', 'refunded', 'transferred']),
  })
)
