import EventAddOn from '#models/event_add_on'
import { createEventAddOnValidator } from '#validators/event_add_on'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'

const validateEventId = vine.compile(
  vine.object({
    params: vine.object({
      eventId: vine.string(),
    }),
  })
)

const validateEventAddOnId = vine.compile(
  vine.object({
    params: vine.object({
      id: vine.string(),
    }),
  })
)

export default class EventAddOnsController {
  /**
   * Create new event add-on
   */
  async addAddOnToEvent({ request, auth, response }: HttpContext) {
    const routePayload = await request.validateUsing(validateEventId)
    const payload = await request.validateUsing(createEventAddOnValidator)

    // Ensure user is an organizer
    if (auth.user?.role !== 'organizer') {
      return response.forbidden({
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Only organizers can add add-ons to events',
        },
        meta: { timestamp: new Date().toISOString() },
      })
    }

    const eventAddOn = await EventAddOn.create({
      eventId: routePayload.params.eventId,
      name: payload.name,
      description: payload.description,
      price: payload.price,
      quantityAvailable: payload.quantityAvailable,
      type: payload.type,
    })

    return response.json({
      success: true,
      data: eventAddOn,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }

  /**
   *
   * Get event add-ons
   */
  async getAddOnsForEvent({ request, response }: HttpContext) {
    const routePayload = await request.validateUsing(validateEventId)

    const eventAddOns = await EventAddOn.query().where('eventId', routePayload.params.eventId)

    return response.json({
      success: true,
      data: eventAddOns,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }

  /**
   * Update event add-on
   */
  async updateAddOnForEvent({ request, response }: HttpContext) {
    const routePayload = await request.validateUsing(validateEventAddOnId)

    const eventAddOn = await EventAddOn.findOrFail(routePayload.params.id)

    await eventAddOn.merge(request.body()).save()

    return response.json({
      success: true,
      data: eventAddOn,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }

  /**
   * Delete event add-on
   */
  async removeAddOnFromEvent({ request, response }: HttpContext) {
    const routePayload = await request.validateUsing(validateEventAddOnId)

    const eventAddOn = await EventAddOn.findOrFail(routePayload.params.id)

    await eventAddOn.delete()

    return response.json({
      success: true,
      data: null,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }
}
