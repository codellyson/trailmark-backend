import Addon, { AddonStatus, AddonType } from '#models/addon'
import Event from '#models/event'
import PhotographyService from '#models/photography_service'
import Ticket, { TicketStatus, TicketType } from '#models/ticket'
import User from '#models/user'
import { createEventValidator, updateEventValidator } from '#validators/event'
import { createAddonValidator } from '#validators/event_add_on'
import {
  createEventTicketValidator,
  updateEventTicketStatusValidator,
  updateEventTicketValidator,
} from '#validators/event_ticket'
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
  slugify(text: string) {
    const randomString = Math.random().toString(36).substring(2, 15)
    return text.toLowerCase().replace(/ /g, '-') + '-' + randomString
  }

  async createEvent({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(createEventValidator)
    // Ensure JSON fields are properly formatted
    console.log(payload)

    if (auth.user?.role !== 'organizer') {
      return response.forbidden({
        success: false,
        data: null,
        error: { code: 'UNAUTHORIZED', message: 'You are not authorized to create an event' },
        meta: { timestamp: new Date().toISOString() },
      })
    }

    const slug = this.slugify(payload.title)

    const event = await Event.create({
      ...payload,
      slug,
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
    console.log({ params })
    const event = await Event.query().where('slug', params.id).firstOrFail()
    await event?.load('organizer')
    await event?.load('tickets_options')
    await event?.load('addons')

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

  async createEventTicket({ request, response, auth }: HttpContext) {
    console.log('createEventTicket', request.body())
    const payload = await request.validateUsing(createEventTicketValidator)
    const params = request.params()
    console.log({ params })
    const event = await Event.findOrFail(params.eventId)

    const tickets = await Ticket.createMany(
      payload.data.map((ticket) => ({
        ...ticket,
        event_id: Number(event.id),
        status: 'draft' as const,
        type: ticket.type as TicketType,
        sales_start_date: DateTime.fromISO(ticket.sales_start_date),
        sales_end_date: DateTime.fromISO(ticket.sales_end_date),
      }))
    )

    return response.json({
      success: true,
      data: tickets,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }

  async createEventAddon({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(createAddonValidator)
    const eventId = request.params().eventId

    const addonsData = payload.add_ons.map((addon) => {
      const baseAddon = {
        name: addon.name,
        description: addon.description,
        type: addon.type as AddonType,
        price: addon.price,
        currency: addon.currency,
        currency_symbol: addon.currency_symbol,
        capacity: addon.capacity,
        status: addon.status as AddonStatus,
        event_id: addon.event_id,
      }
      switch (addon.type) {
        case 'photography':
          return {
            ...baseAddon,
            photo_count: addon.photo_count,
            photographer_id: addon.photographer_id, // Set to null for now until you have valid photographer IDs
            equipment_details: null,
            transportation_details: null,
          }
        case 'equipment_rental':
          return {
            ...baseAddon,
            equipment_details: addon.equipment_details,
            photo_count: null,
            photographer_id: null,
            transportation_details: null,
          }
        case 'transportation':
          return {
            ...baseAddon,
            transportation_details: addon.transportation_details,
            photo_count: null,
            photographer_id: null,
            equipment_details: null,
          }
        default:
          return {
            ...baseAddon,
            photo_count: null,
            photographer_id: null,
            equipment_details: null,
            transportation_details: null,
          }
      }
    })

    const addons = await Addon.createMany(addonsData)
    const event = await Event.findOrFail(eventId)

    let photographyServices: PhotographyService[] = []
    if (payload.add_ons.some((addon) => addon.type === 'photography')) {
      const photographyAddons = addons.filter((addon) => addon.type === 'photography')
      photographyServices = await PhotographyService.createMany(
        photographyAddons.map((addon) => ({
          event_id: Number(event.id),
          addon_id: addon.id,
          photographer_id: addon.photographer_id!,
          price: addon.price,
          photo_count: addon.photo_count!,

          event_date: DateTime.fromISO(event.date as unknown as string),
        }))
      )
    }

    return response.json({
      success: true,
      data: { addons, photographyServices },
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }
  async isValidPhotographer(photographerId: number) {
    const photographer = await User.find(photographerId)
    return photographer !== null
  }

  async getEventTickets({ request, response, auth }: HttpContext) {
    const params = request.params()
    const event = await Event.findOrFail(params.eventId)
    const tickets = await Ticket.query().where('event_id', event.id).preload('event')

    return response.json({
      success: true,
      data: tickets,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }

  async updateEventTicket({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(updateEventTicketValidator)
    const ticketData = payload.data
    const params = request.params()
    const event = await Event.findOrFail(params.eventId)
    const tickets = []

    if (ticketData?.id) {
      const ticketFound = await Ticket.findOrFail(ticketData.id)
      await ticketFound
        .merge({
          ...ticketData,
          sales_start_date: DateTime.fromISO(ticketData.sales_start_date),
          sales_end_date: DateTime.fromISO(ticketData.sales_end_date),
        })
        .save()
      tickets.push(ticketFound)
    } else {
      const ticket = await Ticket.create({
        ...ticketData,
        event_id: Number(event.id),
        sales_start_date: DateTime.fromISO(ticketData?.sales_start_date as string),
        sales_end_date: DateTime.fromISO(ticketData?.sales_end_date as string),
      })
      tickets.push(ticket)
    }

    return response.json({
      success: true,
      data: tickets,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }

  async deleteEventTicket({ request, response, auth }: HttpContext) {
    const params = request.params()
    const ticket = await Ticket.findOrFail(params.id)
    await ticket.delete()

    return response.json({
      success: true,
      data: null,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }

  async deleteEventAddon({ request, response, auth }: HttpContext) {
    const params = request.params()
    const addon = await Addon.findOrFail(params.id)
    await addon.delete()

    return response.json({
      success: true,
      data: null,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }

  async updateEventTicketStatus({ request, response, auth }: HttpContext) {
    const params = request.params()
    const payload = await request.validateUsing(updateEventTicketStatusValidator)
    const ticket = await Ticket.findOrFail(params.id)
    await ticket.merge({ status: payload.status as TicketStatus }).save()

    return response.json({
      success: true,
      data: ticket,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }
}
