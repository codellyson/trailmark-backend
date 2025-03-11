import vine from '@vinejs/vine'

// Base ticket schema
export const eventTicketSchema = vine.object({
  name: vine.string().trim().minLength(2),
  price: vine.number().min(0),
  quantity_available: vine.number().positive(),
  quantity_sold: vine.number().min(0).optional(),
  is_unlimited: vine.boolean(),
  type: vine.enum(['free', 'paid', 'invite-only']),
  status: vine.enum(['draft', 'active', 'paused', 'sold_out', 'expired']).optional(),
  description: vine.string().nullable(),
  perks: vine.array(vine.string()).optional(),
  group_size: vine.number().min(1),
  min_per_order: vine.number().min(1).optional(),
  max_per_order: vine.number().positive().optional(),
  sale_starts_at: vine.string().optional(),
  sale_ends_at: vine.string().optional(),
})

// Create ticket validator
export const createEventTicketValidator = vine.compile(
  vine.object({
    data: eventTicketSchema,
  })
)

// Update ticket validator
export const updateEventTicketValidator = vine.compile(
  vine.object({
    data: vine
      .object({
        tickets: vine
          .array(
            vine.object({
              id: vine.number(),
              ...eventTicketSchema.getProperties(),
            })
          )
          .optional(),
      })
      .optional(),
  })
)

export const updateEventTicketStatusValidator = vine.compile(
  vine.object({
    status: vine.enum(['valid', 'used', 'cancelled', 'refunded', 'transferred']),
  })
)

export const payForTicketValidator = vine.compile(
  vine.object({
    selectedTickets: vine.array(
      vine.object({
        id: vine.number().positive(),
        quantity: vine.number().positive().min(1),
      })
    ),
    email: vine.string().email(),
  })
)
