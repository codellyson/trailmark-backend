import Booking from '#models/booking'
import Event from '#models/event'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class BookingsController {
  /**
   * Get all bookings with pagination and filters
   */
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const status = request.input('status')
    const eventId = request.input('event_id')
    const date = request.input('date')
    const search = request.input('search')

    const query = Booking.query()
      .preload('event')
      .preload('user')

      .orderBy('created_at', 'desc')

    // Apply filters
    if (status) {
      query.where('status', status)
    }

    if (eventId) {
      query.where('event_id', eventId)
    }
    if (date) {
      // @ts-expect-error
      query.where('created_at', '>=', DateTime.fromISO(date).startOf('day').toSQL())!
    }

    if (search) {
      query
        .whereHas('user', (userQuery) => {
          userQuery
            .where('first_name', 'ILIKE', `%${search}%`)
            .orWhere('last_name', 'ILIKE', `%${search}%`)
            .orWhere('email', 'ILIKE', `%${search}%`)
        })
        .orWhere('booking_reference', 'ILIKE', `%${search}%`)
    }

    const bookings = await query.paginate(page, limit)

    return response.ok({
      status: 'success',
      data: bookings,
    })
  }

  /**
   * Get user's bookings
   */
  async userBookings({ auth, request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const status = request.input('status')

    const query = Booking.query()
      .where('user_id', auth.user!.id)
      .preload('event')

      .orderBy('created_at', 'desc')

    if (status) {
      query.where('status', status)
    }

    const bookings = await query.paginate(page, limit)

    return response.ok({
      status: 'success',
      data: bookings,
    })
  }

  /**
   * Get organizer's event bookings
   */
  async organizerEventBookings({ auth, request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const eventId = request.param('eventId')
    const status = request.input('status')
    const search = request.input('search')

    // Verify event belongs to organizer
    const event = await Event.query()
      .where('id', eventId)
      .where('organizer_id', auth.user!.id)
      .firstOrFail()

    const query = Booking.query()
      .where('event_id', event.id)
      .preload('user')

      .orderBy('created_at', 'desc')

    if (status) {
      query.where('status', status)
    }

    if (search) {
      query
        .whereHas('user', (userQuery) => {
          userQuery
            .where('first_name', 'ILIKE', `%${search}%`)
            .orWhere('last_name', 'ILIKE', `%${search}%`)
            .orWhere('email', 'ILIKE', `%${search}%`)
        })
        .orWhere('booking_reference', 'ILIKE', `%${search}%`)
    }

    const bookings = await query.paginate(page, limit)

    return response.ok({
      status: 'success',
      data: bookings,
    })
  }

  /**
   * Get booking details
   */
  async show({ params, auth, response }: HttpContext) {
    const booking = await Booking.query()
      .where('id', params.id)
      .preload('event')
      .preload('user')

      .firstOrFail()

    // Check if user has access to this booking
    const canAccess =
      booking.user_id === auth.user!.id || // User's own booking
      booking.event.organizer_id === auth.user!.id // Organizer's event booking

    if (!canAccess) {
      return response.forbidden({
        status: 'error',
        message: 'You do not have access to this booking',
      })
    }

    return response.ok({
      status: 'success',
      data: booking,
    })
  }

  /**
   * Get booking statistics
   */
  async getStatistics({ auth, params, response }: HttpContext) {
    const eventId = params.eventId

    // Verify event belongs to organizer
    const event = await Event.query()
      .where('id', eventId)
      .where('organizer_id', auth.user!.id)
      .firstOrFail()

    const stats = await Booking.query()
      .where('event_id', event.id)
      .count('* as total')
      .sum('total_amount as revenue')
      .count('* as total_tickets')
      .where('status', 'confirmed')
      .first()

    const recentBookings = await Booking.query()
      .where('event_id', event.id)
      .preload('user')
      .orderBy('created_at', 'desc')
      .limit(5)

    return response.ok({
      status: 'success',
      data: {
        statistics: stats,
        recentBookings,
      },
    })
  }
}
