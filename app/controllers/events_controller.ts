import Event from '#models/event'
import Ticket, { TicketStatus, TicketType } from '#models/ticket'
import User from '#models/user'
import {
  createEventValidator,
  createVendorApplicationValidator,
  generateVendorPaymentLinkValidator,
  updateEventValidator,
} from '#validators/event'
import { createAddonValidator } from '#validators/event_add_on'
import {
  createEventTicketValidator,
  payForTicketValidator,
  updateEventTicketStatusValidator,
  updateEventTicketValidator,
} from '#validators/event_ticket'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Booking from '#models/booking'
import { inject } from '@adonisjs/core'
import TicketPassService from '#services/ticket_pass_service'
import { generateQRCode, generateTicketNumber } from '../utils/ticket.js'
import Vendor from '#models/event_vendor'
import EventVendor from '#models/event_vendor'
import VendorService from '#models/vendor_service'
import { PaymentService } from '#services/payment_service'

@inject()
export default class EventsController {
  constructor(private ticketPassService: TicketPassService) {}

  /**
   * List all events with optional filters
   */
  async getEvents({ request, response, auth }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const status = request.input('status')
    const dateRange = request.input('date_range')
    console.log({ user: auth.user })
    const query = Event.query()
      .where('user_id', auth.user!.id)
      .preload('tickets')
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

    if (auth.user?.role !== 'user') {
      return response.forbidden({
        success: false,
        data: null,
        error: { code: 'UNAUTHORIZED', message: 'Only users can create events' },
        meta: { timestamp: new Date().toISOString() },
      })
    }
    console.log({ payload })
    const event = await Event.create({
      ...payload,
      start_date: DateTime.fromISO(payload.start_date),
      end_date: DateTime.fromISO(payload.end_date),
      social_details: {
        website_url: payload.social_details?.website_url,
        instagram_handle: payload.social_details?.instagram_handle,
        twitter_handle: payload.social_details?.twitter_handle,
        audiomack_url: payload.social_details?.audiomack_url,
        facebook_url: payload.social_details?.facebook_url,
      },
      thumbnails: payload.thumbnails,
      theme_settings: {
        template: payload.theme_settings?.template,
        primary_color: payload.theme_settings?.primary_color,
        secondary_color: payload.theme_settings?.secondary_color,
        font_family: payload.theme_settings?.font_family,
        hero_layout: payload.theme_settings?.hero_layout,
        show_countdown: payload.theme_settings?.show_countdown,
      },
      user_id: Number(auth.user?.id),
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
  public async getEvent({ params, response }: HttpContext) {
    const event = await Event.query().where('id', params.id).firstOrFail()
    await event?.load('user')
    await event?.load('tickets')
    await event?.load('vendors')
    const services = await VendorService.query()
      .whereIn(
        'user_id',
        event.vendors.map((vendor) => vendor.vendor_id)
      )
      .preload('vendor')

    return response.json({
      success: true,
      data: {
        ...event.toJSON(),
        vendor_services: event.vendors.map((vendor) => ({
          ...vendor.toJSON(),
          service_details: services.filter(
            (s) =>
              s.user_id.toString() === vendor.vendor_id.toString() &&
              s.id.toString() === vendor.service_id.toString()
          )[0],
        })),
        created_at: event.created_at,
        updated_at: event.updated_at,
      },
    })
  }

  async getPublicEvent({ params, response }: HttpContext) {
    const event = await Event.query().where('custom_url', params.id).firstOrFail()
    await event?.load('user')
    await event?.load('tickets')
    await event?.load('vendors')
    const services = await VendorService.query()
      .whereIn(
        'user_id',
        event.vendors.map((vendor) => vendor.vendor_id)
      )
      .preload('vendor')

    return response.json({
      success: true,
      data: {
        ...event.toJSON(),
        tickets: event.tickets,
        vendor_services: event.vendors.map((vendor) => ({
          ...vendor.toJSON(),
          service_details: services.filter(
            (s) =>
              s.user_id.toString() === vendor.vendor_id.toString() &&
              s.id.toString() === vendor.service_id.toString()
          )[0],
        })),
        created_at: event.created_at,
      },
    })
  }
  /**;
   * Update event details
   */
  async updateEvent({ params, request, response, auth }: HttpContext) {
    const eventId = params.id
    const event = await Event.query().where('id', eventId).firstOrFail()
    // Check if user is authorized
    if (event.user_id.toString() !== auth.user!.id.toString()) {
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

    if (event.user_id !== Number(auth.user!.id)) {
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

    await event.merge({ status: 'draft' }).save()

    return response.json({
      success: true,
      data: null,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }

  async getEventTickets({ request, response, auth }: HttpContext) {
    const params = request.params()
    const event = await Event.findOrFail(params.eventId)
    const tickets = await Ticket.query().where('event_id', event.id).preload('event')
    console.log({ tickets })

    return response.json({
      success: true,
      data: tickets,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }

  async updateEventTicket({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(updateEventTicketValidator)
    const params = request.params()

    if (!payload.data?.tickets || !payload.data.tickets.length) {
      return response.badRequest({
        success: false,
        error: 'No tickets data provided',
      })
    }

    const updatedTickets = await Promise.all(
      payload.data.tickets.map(async (ticketData) => {
        const ticket = await Ticket.findOrFail(ticketData.id)
        //@ts-expect-error - This is a workaround to remove the created_at and updated_at properties
        const { id, created_at: createAt, updated_at: updateAt, ...updateData } = ticketData
        return ticket
          .merge({
            ...updateData,
            perks: updateData.perks || [],
            sale_ends_at: updateData.sale_ends_at
              ? DateTime.fromISO(updateData.sale_ends_at)
              : undefined,
            sale_starts_at: updateData.sale_starts_at
              ? DateTime.fromISO(updateData.sale_starts_at)
              : undefined,
            status: (updateData.status as TicketStatus) || TicketStatus.DRAFT,
            description: updateData.description || undefined,
            type: (updateData.type as TicketType) || TicketType.PAID,
          })
          .save()
      })
    )

    return response.json({
      success: true,
      data: updatedTickets,
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

  async createVendorApplication({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(createVendorApplicationValidator)
    const vendors = payload.vendors
    const params = request.params()
    const event = await Event.findOrFail(params.id)

    try {
      // Check for existing vendor applications and collect duplicates
      const existingVendors = await EventVendor.query()
        .where('event_id', event.id)
        .whereIn(
          'vendor_id',
          vendors.map((v) => v.vendor_id)
        )

      if (existingVendors.length > 0) {
        const duplicateVendors = existingVendors.map((v) => ({
          vendor_id: v.vendor_id,
          status: v.status,
        }))

        return response.conflict({
          success: false,
          data: null,
          error: {
            code: 'DUPLICATE_VENDOR',
            message: 'One or more vendors are already registered for this event',
            details: {
              duplicateVendors,
              message: 'These vendors are already registered for the event',
            },
          },
          meta: { timestamp: new Date().toISOString() },
        })
      }

      // Filter out any vendors that already exist
      const newVendors = vendors.filter(
        (vendor) => !existingVendors.some((ev) => ev.vendor_id === vendor.vendor_id)
      )

      // Only create applications for new vendors
      const vendorApplications = await EventVendor.createMany(
        newVendors.map((vendor) => ({
          event_id: event.id.toString(),
          ...vendor,
          setup_time: DateTime.fromISO(vendor.setup_time),
          teardown_time: DateTime.fromISO(vendor.teardown_time),
        }))
      )

      return response.json({
        success: true,
        data: vendorApplications,
        error: null,
        meta: { timestamp: new Date().toISOString() },
      })
    } catch (error) {
      console.error('Vendor application creation error:', error)

      // Handle specific database constraint violation
      if (error.code === '23505') {
        return response.conflict({
          success: false,
          data: null,
          error: {
            code: 'DUPLICATE_VENDOR',
            message: 'One or more vendors are already registered for this event',
            details: {
              constraint: error.constraint,
              detail: error.detail,
            },
          },
          meta: { timestamp: new Date().toISOString() },
        })
      }

      // Handle other potential errors
      return response.internalServerError({
        success: false,
        data: null,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to create vendor application',
          details: error.message,
        },
        meta: { timestamp: new Date().toISOString() },
      })
    }
  }

  async getVendorApplications({ request, response, auth }: HttpContext) {
    const params = request.params()
    const event = await Event.findOrFail(params.eventId)
    const vendorApplications = await EventVendor.query().where('event_id', event.id)
    return response.json({
      success: true,
      data: vendorApplications,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }

  async generateVendorPaymentLink({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(generateVendorPaymentLinkValidator)
    const params = request.params()
    const event = await Event.findOrFail(params.eventId)
    const vendorApplication = await EventVendor.findOrFail(params.id)
    return response.json({
      success: true,
      data: vendorApplication,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }

  async createEventTicket({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(createEventTicketValidator)
    const data = payload.data
    const params = request.params()
    console.log({ params })
    console.log({ payload })
    const event = await Event.findOrFail(params.eventId)
    const ticket = await Ticket.create({
      ...data,
      event_id: event.id,
      sale_ends_at: data.sale_ends_at ? DateTime.fromISO(data.sale_ends_at) : undefined,
      sale_starts_at: data.sale_starts_at ? DateTime.fromISO(data.sale_starts_at) : undefined,
      status: (data.status as TicketStatus) || TicketStatus.DRAFT,
      type: data.type as TicketType,
      description: data.description || undefined,
      perks: Array.isArray(data.perks) ? data.perks : [],
    })

    return response.json({
      success: true,
      data: ticket,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }

  async getUpcomingEvents({ request, response, auth }: HttpContext) {
    const events = await Event.query()
      .where('user_id', auth.user!.id)
      .where('start_date', '>', DateTime.now().toISO())
      .orderBy('start_date', 'asc')

    return response.json({
      success: true,
      data: events,
    })
  }

  generateReference() {
    return `NE-TICKET-${Math.random().toString(36).substring(2, 15)}`
  }

  async payForTicket({ request, response, auth }: HttpContext) {
    const params = request.params()
    const event = await Event.findOrFail(params.eventId)
    try {
      const payload = await request.validateUsing(payForTicketValidator)
      const selectedTickets = payload.selectedTickets
      let totalAmountInKobo = 0

      // Collect ticket details for metadata
      const ticketDetails = []

      for (const ticket of selectedTickets) {
        const existingTicket = await Ticket.findOrFail(ticket.id)
        console.log({ existingTicket: existingTicket.toJSON() })

        // Validate ticket availability
        if (!existingTicket.isAvailable()) {
          return response.badRequest({
            success: false,
            error: {
              code: 'TICKET_UNAVAILABLE',
              message: `Ticket ${existingTicket.name} is no longer available`,
            },
            meta: { timestamp: DateTime.now().toISO() },
          })
        }

        if (Number(existingTicket.quantity_available) < ticket.quantity) {
          return response.badRequest({
            success: false,
            error: {
              code: 'INSUFFICIENT_QUANTITY',
              message: `Insufficient quantity available for ticket ${existingTicket.name}`,
            },
            meta: { timestamp: DateTime.now().toISO() },
          })
        }

        try {
          await existingTicket.validatePurchaseQuantity(ticket.quantity)
        } catch (error) {
          return response.badRequest({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: error.message,
            },
            meta: { timestamp: DateTime.now().toISO() },
          })
        }

        const amount = Number.parseFloat(existingTicket.price.toString())
        const PLATFORM_FEE = existingTicket.calculatePlatformFee(amount)
        const totalAmount = existingTicket.calculateTotalPrice(ticket.quantity) + PLATFORM_FEE
        totalAmountInKobo += totalAmount * 100

        ticketDetails.push({
          id: existingTicket.id,
          name: existingTicket.name,
          price: existingTicket.price,
          quantity: ticket.quantity,
          type: existingTicket.type,
          event_id: existingTicket.event_id,
        })
      }
      const eventOrganiserId = event.user_id

      const payment = await new PaymentService().createPayment({
        amount: totalAmountInKobo,
        email: payload.email,
        reference: this.generateReference(),
        metadata: {
          payment_type: 'ticket',
          event_organiser_id: eventOrganiserId,
          event_id: event.id,
          tickets: ticketDetails,
          user: payload.email,
        },
      })

      return response.json({
        success: true,
        data: payment.data,
        error: null,
        meta: { timestamp: DateTime.now().toISO() },
      })
    } catch (error) {
      console.log({ error })
      if (error instanceof Error && error.message === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: {
            code: 'TICKET_NOT_FOUND',
            message: 'One or more selected tickets were not found',
          },
          meta: { timestamp: DateTime.now().toISO() },
        })
      }

      console.error('Payment creation error:', error)
      return response.badRequest({
        success: false,
        data: null,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to create payment',
          details: error.message,
        },
        meta: { timestamp: DateTime.now().toISO() },
      })
    }
  }
}
