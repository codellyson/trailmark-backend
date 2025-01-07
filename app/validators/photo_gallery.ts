import vine from '@vinejs/vine'

export const createGalleryValidator = vine.compile(
  vine.object({
    eventId: vine.number().optional(),
    bookingId: vine.number().optional(),
  })
)

export const createBookingGalleryValidator = vine.compile(
  vine.object({
    bookingId: vine.number(),
  })
)

export const updateGalleryValidator = vine.compile(
  vine.object({
    galleryType: vine.enum(['event_private', 'event_public', 'booking_private']),
    eventId: vine.number().optional(),
    bookingId: vine.number().optional(),
  })
)

export const galleryIdValidator = vine.compile(
  vine.object({
    params: vine.object({
      id: vine.number(),
    }),
  })
)

export const eventIdValidator = vine.compile(
  vine.object({
    params: vine.object({
      id: vine.number(),
    }),
  })
)
