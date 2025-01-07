import Booking from '#models/booking'
import BookingAddOn from '#models/booking_add_on'
import Event from '#models/event'
import { generateTicketNumber } from '#services/ticket'
import {
  bookingAddOnIdValidator,
  createBookingAddOnValidator,
  createBookingValidator,
} from '#validators/booking'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'

export default class BookingsController {
  /**
   * Create new booking
   */
  async createBooking({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(createBookingValidator)

    const event = await Event.findOrFail(payload.eventId)

    // Check event availability
    const bookingsCount = await Booking.query()
      .where('eventId', event.id)
      .whereNot('status', 'cancelled')
      .count('* as total')
      .first()

    if (bookingsCount?.total! >= event.capacity) {
      return response.badRequest({
        success: false,
        data: null,
        error: {
          code: 'CAPACITY_EXCEEDED',
          message: 'Event has reached maximum capacity',
        },
        meta: { timestamp: new Date().toISOString() },
      })
    }

    const booking = await Booking.create({
      eventId: event.id,
      userId: auth.user!.id.toString(),
      ticketNumber: await generateTicketNumber(),
      totalAmount:
        event.basePrice +
        (payload.addOns?.reduce((sum, addon) => sum + addon.price * addon.quantity, 0) || 0),
      photographyIncluded: payload.photographyIncluded || false,
      status: 'pending',
    })

    // Create add-ons if any
    if (payload.addOns?.length) {
      await booking.related('addOns').createMany(payload.addOns)
    }

    await booking.load('addOns')
    await booking.load('event')

    return response.json({
      success: true,
      data: booking,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }

  /**
   * Get booking details
   */
  async getBooking({ params, response, auth }: HttpContext) {
    const booking = await Booking.findOrFail(params.id)
    // Check if user owns the booking or is the event organizer
    if (
      booking.userId !== auth.user!.id.toString() &&
      booking.event.organizerId !== auth.user!.id
    ) {
      return response.forbidden({
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to view this booking',
        },
        meta: { timestamp: new Date().toISOString() },
      })
    }

    await booking.load('event')
    await booking.load('addOns')
    await booking.load('user')

    return response.json({
      success: true,
      data: booking,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }

  async updateBooking({ request, response, auth }: HttpContext) {
    const bookingIdValidator = vine.compile(
      vine.object({
        params: vine.object({
          id: vine.string(),
        }),
      })
    )
    const BookingStatusEnum = ['pending', 'confirmed', 'cancelled']

    const bookingUpdateValidator = vine.compile(
      vine.object({
        status: vine.enum(BookingStatusEnum),
      })
    )

    const routePayload = await request.validateUsing(bookingIdValidator)
    const booking = await Booking.findOrFail(routePayload.params.id)

    if (auth.user?.role !== 'organizer' && booking.userId !== auth.user!.id.toString()) {
      return response.forbidden({
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to update this booking',
        },
        meta: { timestamp: new Date().toISOString() },
      })
    }

    const payload = await request.validateUsing(bookingUpdateValidator)

    booking.status = payload.status as typeof booking.status

    await booking.save()

    return response.json({
      success: true,
      data: booking,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }

  async deleteBooking({ params, response, auth }: HttpContext) {
    const booking = await Booking.findOrFail(params.id)

    if (auth.user?.role !== 'organizer' && booking.userId !== auth.user!.id.toString()) {
      return response.forbidden({
        success: false,
        data: null,
      })
    }

    await booking.delete()

    return response.json({
      success: true,
      data: null,
    })
  }

  async createBookingAddOn({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(createBookingAddOnValidator)
    const routePayload = await request.validateUsing(bookingAddOnIdValidator)
    const booking = await Booking.findOrFail(payload.bookingId)

    if (auth.user?.role !== 'organizer' && booking.userId !== auth.user!.id.toString()) {
      return response.forbidden({
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to update this booking',
        },
      })
    }

    const addOn = await BookingAddOn.findOrFail(routePayload.params.id)

    await booking.related('addOns').create({
      addOnId: addOn.id,
      quantity: payload.quantity,
      bookingId: booking.id,
      priceAtTime: addOn.priceAtTime,
    })

    await booking.load('addOns')

    return response.json({
      success: true,
      data: booking,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }
}
