import EventPhotographer from '#models/event_photographer'
import {
  createEventPhotographerValidator,
  updateEventPhotographerStatusValidator,
} from '#validators/event_photographer'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'

const validateEventId = vine.compile(
  vine.object({
    params: vine.object({
      eventId: vine.number(),
    }),
  })
)

const validateEventPhotographerId = vine.compile(
  vine.object({
    params: vine.object({
      id: vine.string(),
    }),
  })
)

export default class EventPhotographersController {
  /**
   * Create new event photographer assignment
   */
  async addPhotographerToEvent({ request, response, auth }: HttpContext) {
    const routePayload = await request.validateUsing(validateEventId)
    const payload = await request.validateUsing(createEventPhotographerValidator)

    // Ensure user is a photographer
    if (auth.user?.role !== 'organizer') {
      return response.forbidden({
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Only organizers can assign photographers to events',
        },
        meta: { timestamp: new Date().toISOString() },
      })
    }

    const eventPhotographer = await EventPhotographer.create({
      eventId: routePayload.params.eventId,
      photographerId: payload.photographerId,
      pricePerPerson: payload.pricePerPerson,
      status: 'pending',
    })

    return response.json({
      success: true,
      data: eventPhotographer,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }

  /**
   * Get event photographers
   */
  async getPhotographersForEvent({ request, response }: HttpContext) {
    const routePayload = await request.validateUsing(validateEventId)

    const photographers = await EventPhotographer.query()
      .where('eventId', routePayload.params.eventId)
      .preload('photographer')

    return response.json({
      success: true,
      data: photographers,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }

  /**
   * Update event photographer status
   */
  async updateEventPhotographerStatus({ request, response, auth }: HttpContext) {
    const routePayload = await request.validateUsing(validateEventPhotographerId)
    const payload = await request.validateUsing(updateEventPhotographerStatusValidator)
    const eventPhotographer = await EventPhotographer.findOrFail(routePayload.params.id)

    // Check if user is authorized (either the photographer or event organizer)
    const event = await eventPhotographer.related('event').query().firstOrFail()
    if (eventPhotographer.photographerId !== auth.user!.id && event.organizerId !== auth.user!.id) {
      return response.forbidden({
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to update this assignment',
        },
        meta: { timestamp: new Date().toISOString() },
      })
    }

    await eventPhotographer
      .merge({
        status: payload.status,
        pricePerPerson: payload.pricePerPerson,
      })
      .save()

    return response.json({
      success: true,
      data: eventPhotographer,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }

  /**
   * Remove photographer from event
   */
  async removePhotographerFromEvent({ request, response, auth }: HttpContext) {
    const routePayload = await request.validateUsing(validateEventPhotographerId)
    const eventPhotographer = await EventPhotographer.findOrFail(routePayload.params.id)

    // Check if user is authorized (either the photographer or event organizer)
    const event = await eventPhotographer.related('event').query().firstOrFail()
    if (eventPhotographer.photographerId !== auth.user!.id && event.organizerId !== auth.user!.id) {
      return response.forbidden({
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to remove this assignment',
        },
        meta: { timestamp: new Date().toISOString() },
      })
    }

    await eventPhotographer.delete()

    return response.json({
      success: true,
      data: null,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }
}
