import vine from '@vinejs/vine'

export const createBookingValidator = vine.compile(
  vine.object({
    eventId: vine.string().uuid(),
    photographyIncluded: vine.boolean().optional(),
    addOns: vine
      .array(
        vine.object({
          addOnId: vine.string().uuid(),
          quantity: vine.number().min(1),
          price: vine.number().min(0),
        })
      )
      .optional(),
    waiverAccepted: vine.boolean(),
  })
)

export const createBookingAddOnValidator = vine.compile(
  vine.object({
    addOnId: vine.string(),
    quantity: vine.number().min(1),
    bookingId: vine.string(),
  })
)
const BookingStatusEnum = ['pending', 'confirmed', 'cancelled']

export const updateBookingValidator = vine.compile(
  vine.object({
    status: vine.enum(BookingStatusEnum),
  })
)

export const bookingIdValidator = vine.compile(
  vine.object({
    params: vine.object({
      id: vine.string(),
    }),
  })
)

export const bookingAddOnIdValidator = vine.compile(
  vine.object({
    params: vine.object({
      id: vine.string(),
    }),
  })
)
