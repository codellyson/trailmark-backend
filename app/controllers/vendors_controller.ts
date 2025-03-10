import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import Vendor from '#models/event_vendor'
import {
  createVendorServiceValidator,
  createVendorValidator,
  updateVendorServiceValidator,
  updateVendorValidator,
} from '#validators/vendor'
import { errors } from '@adonisjs/core'
import User from '#models/user'
import VendorService from '#models/vendor_service'
import Event from '#models/event'
import { HttpStatusCode } from 'axios'
import { DateTime } from 'luxon'
import EventVendor from '#models/event_vendor'
import { PaymentService } from '#services/payment_service'

@inject()
export default class VendorsController {
  /**
   * List all vendors with optional filtering
   */
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const search = request.input('search')

    const query = User.query().where('role', 'vendor')

    if (search) {
      query.where((builder) => {
        builder
          .where('business_name', 'ILIKE', `%${search}%`)
          .orWhere('business_description', 'ILIKE', `%${search}%`)
      })
    }

    try {
      query.preload('vendor_services')
      const vendors = await query.paginate(page, limit)

      console.log('Vendors:', vendors) // Add this to debug

      return response.json({
        success: true,
        data: {
          // @ts-ignore
          data: vendors.rows.map((vendor) => ({
            id: vendor.id,
            avatar_url: vendor.avatar_url,
            business_email: vendor.email,
            business_name: vendor.business_name,
            status: vendor.status,
            services: vendor.vendor_services,
          })),
          meta: vendors.getMeta(),
        },
        error: null,
      })
    } catch (error) {
      console.error('Error fetching vendors:', error)
      return response.internalServerError({
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching vendors',
        },
      })
    }
  }

  async searchByServices({ request, response }: HttpContext) {
    const { services, page = 1, limit = 10 } = request.qs()

    if (!services || !Array.isArray(services)) {
      return response.badRequest({
        success: false,
        error: 'Services must be an array',
      })
    }

    const vendors = await User.query()
      .where('role', 'vendor')
      .whereRaw('services ?| array[:services]', { services })

      .paginate(page, limit)

    return response.ok(vendors)
  }

  async vendorListing({ request, response }: HttpContext) {
    const { page = 1, limit = 10 } = request.qs()
    const query = VendorService.query().where('status', 'active')
    const vendors = await query.preload('vendor').paginate(page, limit)

    return response.json({
      success: true,
      // @ts-ignore
      data: vendors.rows.map((vendor) => ({
        id: vendor.id,
        name: vendor.name,
        price: vendor.price,
        price_type: vendor.price_type,
        description: vendor.description,
        category: vendor.category,
        images: vendor.images,
        features: vendor.features,
        vendor: vendor.vendor,
      })),
      meta: vendors.getMeta(),
    })
  }

  async getVendorServices({ request, response, auth }: HttpContext) {
    const id = auth.user?.id
    const services = await VendorService.query().where('user_id', id!)
    return response.status(HttpStatusCode.Ok).json({
      success: true,
      data: services,
    })
  }

  async updateVendor({ request, response, auth }: HttpContext) {
    const id = auth.user?.id
    const { data } = request.body()

    const vendor = await User.find(id)

    if (!vendor) {
      return response.notFound({
        success: false,
        error: 'Vendor not found',
      })
    }

    vendor.merge(data)
    await vendor.save()

    return response.ok(vendor)
  }

  // Vendor Services

  async createVendorService({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(createVendorServiceValidator)
    const id = auth.user?.id

    const vendor = await User.find(id)

    if (!vendor) {
      return response.notFound({
        success: false,
        error: 'Vendor not found',
      })
    }

    const imagesArray = payload.images?.length! > 0 ? payload.images! : []
    const featuresArray = payload.features?.length! > 0 ? payload.features! : []

    const serviceData = {
      name: payload.name,
      price: payload.price,
      price_type: payload.price_type,
      description: payload.description,
      category: payload.category,
      status: payload.status || 'active',
      user_id: String(vendor.id),
      images: imagesArray,
      features: featuresArray,
    }

    const service = await VendorService.create(serviceData)

    return response.ok({
      success: true,
      data: {
        ...service.toJSON(),
        images: imagesArray,
        features: featuresArray,
      },
      error: null,
    })
  }

  async updateVendorService({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(updateVendorServiceValidator)
    const id = auth.user?.id

    const service = await VendorService.find(id)

    if (!service) {
      return response.notFound({
        success: false,
        error: 'Service not found',
      })
    }
    // @ts-ignore
    service.merge(payload)
    await service.save()

    return response.ok(service)
  }

  async deleteVendorService({ request, response, auth }: HttpContext) {
    const { id } = request.params()
    const service = await VendorService.find(id)

    if (!service) {
      return response.notFound({
        success: false,
        error: 'Service not found',
      })
    }

    await service.delete()

    return response.ok({
      success: true,
      message: 'Service deleted successfully',
    })
  }

  // Vendor Events
  async getVendorUpcomingEvents({ request, response, auth }: HttpContext) {
    const id = auth.user?.id

    if (!id) {
      return response.unauthorized({
        success: false,
        error: 'Unauthorized',
      })
    }

    const vendorEvents = await EventVendor.query()
      .where('vendor_id', Number(id))
      .preload('event', (builder) => builder.where('start_date', '>', DateTime.now().toSQL()))

    const vendorUpcomingEvents = vendorEvents.map((event) => event.event.toJSON())

    return response.ok({
      success: true,
      data: vendorUpcomingEvents,
    })
  }

  async getPastEvents({ request, response, auth }: HttpContext) {
    const id = auth.user?.id

    if (!id) {
      return response.unauthorized({
        success: false,
        error: 'Unauthorized',
      })
    }

    // return events that are past and the vendor is a vendor for the event
    const events = await Event.query()
      .where('user_id', id)
      .where('start_date', '<', DateTime.now().toSQL())
      .whereHas('vendors', (builder) => builder.where('user_id', id))

    return response.ok(events)
  }

  async getVendorEvent({ request, response, auth }: HttpContext) {
    const { id } = request.params()
    const event = await Event.find(id)
    const vendor = await User.find(auth.user?.id)
    event?.load('vendors')

    if (!event || !vendor) {
      return response.notFound({
        success: false,
        error: 'Event or vendor not found',
      })
    }

    if (!vendor) {
      return response.notFound({
        success: false,
        error: 'Vendor not found',
      })
    }

    return response.ok(event)
  }

  async getAllVendors({ request, response, auth }: HttpContext) {
    const vendors = await User.query().where('role', 'vendor')
    return response.ok(vendors)
  }

  async vendorExpressInterest({ request, response, auth }: HttpContext) {
    const { eventId } = request.params()
    const { message } = request.body()
    const user = auth.user

    const event = await Event.find(eventId)

    if (!event) {
      return response.notFound({
        success: false,
        error: 'Event not found',
      })
    }

    return response.ok({
      success: true,
      data: event,
    })
  }

  async vendorPayForApplication({ request, response, auth }: HttpContext) {
    const { eventId } = request.params()
    const { message } = request.body()
    const user = auth.user

    const event = await Event.find(eventId)

    if (!event) {
      return response.notFound({
        success: false,
        error: 'Event not found',
      })
    }
  }

  async getFavoriteVendors({ request, response, auth }: HttpContext) {
    const id = auth.user?.id
    const user = await User.find(id)

    const favoirtedVendors = user?.favorite_vendors

    const vendors = await User.query()
      .where('role', 'vendor')
      // @ts-ignore
      .whereIn('id', favoirtedVendors)
      .preload('vendor_services')

    return response.ok(vendors)
  }

  async toggleFavoriteVendor({ request, response, auth }: HttpContext) {
    const { id } = request.params()

    const user = auth.user
    const authUser = await User.find(user?.id)
    const vendor = await User.find(id)
    if (!vendor) {
      return response.notFound({
        success: false,
        error: 'Vendor not found',
      })
    }

    if (!authUser) {
      return response.unauthorized({
        success: false,
        error: 'Unauthorized',
      })
    }

    const currentFavorites = authUser.favorite_vendors || []
    const vendorId = vendor.id

    // Convert all existing values to numbers and remove duplicates
    const normalizedFavorites = [...new Set(currentFavorites.map(Number))]

    // Toggle: remove if exists, add if doesn't exist
    authUser.favorite_vendors = normalizedFavorites.includes(vendorId)
      ? normalizedFavorites.filter((_id) => _id !== vendorId)
      : [...normalizedFavorites, vendorId]

    await authUser?.save()

    return response.ok({
      success: true,
      data: authUser,
    })
  }

  // Get Connected Vendors for organisers
  async getConnectedVendors({ request, response, auth }: HttpContext) {
    try {
      const id = auth.user?.id

      const events = await Event.query().where('user_id', id!)
      const eventVendors = await EventVendor.query().whereIn(
        'event_id',
        events.map((event) => event.id)
      )

      const services = await VendorService.query()
        .whereIn(
          'id',
          eventVendors.map((eventVendor) => {
            return eventVendor.service_id
          })
        )
        .preload('vendor')

      const connectedServices = eventVendors.map((eventVendor) => {
        const service = services.find((serv) => serv.id.toString() === eventVendor.service_id)
        // @ts-ignore
        const event = events.find((evnt) => evnt.id === eventVendor.event_id)
        return {
          ...eventVendor.toJSON(),
          service: service?.toJSON(),
          event: event,
        }
      })

      return response.ok({
        success: true,
        data: connectedServices,
      })
    } catch (error) {
      console.error('Error in getConnectedVendors:', error)
      return response.internalServerError({
        success: false,
        error: 'An error occurred while fetching connected vendors',
      })
    }
  }

  // Vendor Connected Events
  async getVendorConnectedEvents({ request, response, auth }: HttpContext) {
    const id = auth.user?.id
    const eventVendors = await EventVendor.query().where('vendor_id', Number(id))
    const events = await Event.query().whereIn(
      'id',
      eventVendors.map((eventVendor) => eventVendor.event_id)
    )

    const services = await VendorService.query()
      .whereIn(
        'id',
        eventVendors.map((eventVendor) => {
          return eventVendor.service_id
        })
      )
      .preload('vendor')

    const transformed = eventVendors.map((eventVendor) => {
      return {
        ...eventVendor.toJSON(),
        // @ts-ignore
        event: events.find((event) => event.id === eventVendor.event_id),
        service: services.find((service) => service.id.toString() === eventVendor.service_id),
      }
    })

    return response.ok({
      success: true,
      data: transformed,
    })
  }

  async generatePaymentLink({ request, response, auth }: HttpContext) {
    const { vendorId } = request.params()
    const { amount } = request.body()

    const vendor = await User.find(vendorId)

    if (!vendor) {
      return response.notFound({
        success: false,
        error: 'Vendor not found',
      })
    }

    const paymentLink = await new PaymentService().createPayment({
      email: vendor.email,
      amount: amount,
      reference: vendor.id.toString(),
    })
    console.log({ paymentLink })
    return response.ok(paymentLink)
  }
  async verifyPayment({ request, response, auth }: HttpContext) {
    const { vendorId } = request.params()
    const { reference } = request.body()

    const vendor = await User.find(vendorId)

    if (!vendor) {
      return response.notFound({
        success: false,
        error: 'Vendor not found',
      })
    }

    const payment = await new PaymentService().verifyPayment(reference)

    return response.ok(payment)
  }
}
