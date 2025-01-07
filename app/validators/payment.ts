import vine from '@vinejs/vine'

export const createPaymentIntentValidator = vine.compile(
  vine.object({
    bookingId: vine.string().uuid(),
  })
)
