import vine from '@vinejs/vine'

export const uploadEventPhotosValidator = vine.compile(
  vine.object({
    photos: vine.array(
      vine.file({
        size: '10mb',
        extnames: ['jpg', 'jpeg', 'png'],
      })
    ),
    takenAt: vine.date().optional(),
    status: vine.enum(['pending', 'approved', 'rejected']).optional(),
  })
)

export const updateGalleryValidator = vine.compile(
  vine.object({
    galleryType: vine.enum(['event_private', 'event_public', 'booking_private']),
    bookingId: vine.number().optional(),
    eventId: vine.number().optional(),
  })
)

export const deleteGalleryValidator = vine.compile(
  vine.object({
    id: vine.number(),
  })
)

export const getGalleryValidator = vine.compile(
  vine.object({
    id: vine.number(),
  })
)

export const deletePhotoValidator = vine.compile(
  vine.object({
    id: vine.number(),
  })
)

export const getPhotosForEventValidator = vine.compile(
  vine.object({
    eventId: vine.number(),
  })
)

export const uploadPhotosValidator = vine.compile(
  vine.object({
    galleryId: vine.number(),
    eventId: vine.number().optional(),
    bookingId: vine.number().optional(),

    photos: vine.array(
      vine.file({
        size: '10mb',
        extnames: ['jpg', 'jpeg', 'png'],
      })
    ),
  })
)

export const getBookingPhotosValidator = vine.compile(
  vine.object({
    eventId: vine.number(),
    bookingId: vine.number(),
  })
)

export const createEventGalleryValidator = vine.compile(
  vine.object({
    eventId: vine.number(),
  })
)
