import Event from '#models/event'
import { createEventValidator, updateEventValidator } from '#validators/event'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class EventsController {
  /**
   * List all events with optional filters
   */
  async getEvents({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const status = request.input('status')
    const dateRange = request.input('date_range')

    const query = Event.query()
      // .preload('organizer')
      .if(status, (q) => q.where('status', status))
      .if(dateRange, (q) => {
        const [start, end] = dateRange.split(',')
        return q.whereBetween('eventDate', [start, end])
      })

    const events = await query.paginate(page, limit)

    return response.json({
      success: true,
      data: events,
      error: null,
      meta: {
        pagination: events.getMeta(),
        timestamp: new Date().toISOString(),
      },
    })
  }

  /**
   * Create a new event
   */
  async createEvent({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(createEventValidator)
    // Ensure JSON fields are properly formatted
    console.log(auth.user?.role)
    if (auth.user?.role !== 'organizer') {
      return response.forbidden({
        success: false,
        data: null,
        error: { code: 'UNAUTHORIZED', message: 'You are not authorized to create an event' },
        meta: { timestamp: new Date().toISOString() },
      })
    }

    const event = await Event.create({
      ...payload,
      organizer_id: auth.user!.id,
      status: 'draft',
      date: DateTime.fromISO(payload.date),
    })

    return response.json({
      success: true,
      data: event,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }

  /**
   * Get event details
   */
  async getEvent({ params, response }: HttpContext) {
    const event = await Event.findOrFail(params.id)
    await event.load('organizer')
    await event.load('photographers')

    return response.json({
      success: true,
      data: event,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }

  /**
   * Update event details
   */
  async updateEvent({ params, request, response, auth }: HttpContext) {
    const event = await Event.findOrFail(params.id)

    // Check if user is authorized
    if (event.organizer_id !== auth.user!.id) {
      return response.forbidden({
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to update this event',
        },
        meta: { timestamp: new Date().toISOString() },
      })
    }

    const payload = await request.validateUsing(updateEventValidator as any)
    await event.merge({ ...payload }).save()

    return response.json({
      success: true,
      data: event,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }

  /**
   * Cancel/delete event
   */
  async deleteEvent({ params, response, auth }: HttpContext) {
    const event = await Event.findOrFail(params.id)

    if (event.organizer_id !== auth.user!.id) {
      return response.forbidden({
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to cancel this event',
        },
        meta: { timestamp: new Date().toISOString() },
      })
    }

    await event.merge({ status: 'cancelled' }).save()

    return response.json({
      success: true,
      data: null,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }
}
