import vine from '@vinejs/vine'

// Base ticket schema
export const eventTicketSchema = vine.object({
  name: vine.string(),
  price: vine.number(),
  quantity: vine.enum(['limited', 'unlimited']),
  limit: vine.number(),
  type: vine.enum(['free', 'paid', 'invite-only']),
  description: vine.string(),
  perks: vine.array(vine.string()),
  group_size: vine.number(),
  custom_questions: vine
    .array(
      vine.object({
        id: vine.string(),
        question: vine.string(),
        type: vine.string(),
        required: vine.boolean(),
        options: vine.array(vine.string()),
      })
    )
    .optional(),
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
              id: vine.string(),
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
