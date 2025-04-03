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
import vine from '@vinejs/vine'

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
            business_description: vendor.business_description,
            business_category: vendor.business_category,
            business_location: vendor.business_location,
            business_phone: vendor.business_phone,
            business_website: vendor.business_website,
            business_social_media: vendor.business_social_media,
            business_social_media_links: vendor.business_social_media_links,
            business_address: vendor.business_address,

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

  async getPublicVendorServices({ request, response }: HttpContext) {
    try {
      const services = await VendorService.query().where('status', 'active')
      return response.status(HttpStatusCode.Ok).json({
        success: true,
        data: services,
        error: null,
        meta: {
          timestamp: DateTime.now().toISO(),
        },
      })
    } catch (error) {
      console.error('Error fetching public vendor services:', error)
      return response.internalServerError({
        success: false,
        error: 'An error occurred while fetching public vendor services',
      })
    }
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
  generateReference() {
    return 'NE-VENDOR-' + Math.random().toString(36).substring(2, 5)
  }
  async generatePaymentLink({ request, response, auth }: HttpContext) {
    const { serviceId } = request.params()

    const vendor = await User.find(auth.user?.id)
    console.log({ serviceId })

    if (!vendor) {
      return response.notFound({
        success: false,
        error: 'Vendor not found',
      })
    }

    const eventVendorService = await EventVendor.find(serviceId)

    if (!eventVendorService) {
      return response.notFound({
        success: false,
        error: 'Vendor service not found',
      })
    }

    const customFields = [
      {
        display_name: 'Vendor ID',
        variable_name: 'vendor_id',
        value: vendor.id,
      },
      {
        display_name: 'Service ID',
        variable_name: 'service_id',
        value: serviceId,
      },
      {
        display_name: 'Event ID',
        variable_name: 'event_id',
        value: eventVendorService.event_id,
      },
      {
        display_name: 'Payment Type',
        variable_name: 'payment_type',
        value: 'vendor_registration',
      },
    ]

    const event = await Event.find(eventVendorService.event_id)
    const VENDOR_REGISTRATION_FEE = Number.parseFloat(event?.vendor_charge.toString()!)
    const PLATFORM_FEE = 0.05
    const PERCENT = VENDOR_REGISTRATION_FEE * PLATFORM_FEE
    const totalAmount = VENDOR_REGISTRATION_FEE + PERCENT
    //in lowest currency
    const totalAmountInLowestCurrency = Math.round(totalAmount * 100)

    const eventOrganiserId = event?.user_id

    const paymentLink = await new PaymentService().createPayment({
      email: vendor.email,
      amount: totalAmountInLowestCurrency,
      reference: this.generateReference(),
      metadata: {
        payment_type: 'vendor_registration',
        event_organiser_id: eventOrganiserId,
        event_vendor_id: eventVendorService.id,
        event_vendor_service_id: eventVendorService.id,
        vendor_id: vendor.id,
        event_id: eventVendorService.event_id,
        custom_fields: customFields,
      },
    })
    console.log({ paymentLink })
    return response.ok({
      success: true,
      data: paymentLink,
    })
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

  async generateQuickVendorPaymentLink({ request, response, auth }: HttpContext) {
    try {
      const { eventId } = request.params()
      const validationSchema = vine.compile(
        vine.object({
          vendorData: vine.object({
            business_name: vine.string(),
            email: vine.string(),
            phone: vine.string(),
            name: vine.string(),
            description: vine.string(),
            price: vine.number(),
            price_type: vine.enum(['fixed', 'from', 'hourly', 'daily']),
            category: vine.string(),
            images: vine.array(vine.string()).optional(),
            features: vine.array(vine.string()).optional(),
            callback_url: vine.string().optional(),
          }),
        })
      )

      const payload = await validationSchema.validate(request.body())

      const userByEmail = await User.findBy('email', payload.vendorData.email)
      let vendor: User | null = null

      if (!userByEmail) {
        const password = Math.random().toString(36).substring(2, 15)
        vendor = await User.create({
          business_name: payload.vendorData.business_name,
          email: payload.vendorData.email,
          phone: payload.vendorData.phone,
          password: password,
          first_name: '',
          last_name: '',
          role: 'vendor',
        })
      } else {
        vendor = userByEmail
      }

      // Create the vendor service first
      const vendorService = await VendorService.create({
        name: payload.vendorData.name,
        price: payload.vendorData.price,
        price_type: payload.vendorData.price_type,
        user_id: vendor.id.toString(),
        description: payload.vendorData.description,
        category: payload.vendorData.category,
        images: payload.vendorData.images || [],
        features: payload.vendorData.features || [],
        status: 'active',
      })

      try {
        // Check if this specific service is already registered for this event
        const existingEventVendor = await EventVendor.query()
          .where('event_id', eventId)
          .where('vendor_id', vendor.id.toString())
          .where('service_id', vendorService.id.toString())
          .first()

        if (existingEventVendor) {
          // Clean up the created service since we won't be using it
          await vendorService.delete()
          return response.badRequest({
            success: false,
            error: 'This service is already registered for this event',
          })
        }

        const eventVendor = await EventVendor.create({
          event_id: eventId,
          service_id: vendorService.id.toString(),
          vendor_id: vendor.id.toString(),
          // agreed_price: vendorService.price,
        })

        const event = await Event.find(eventId)
        const eventOrganiserId = event?.user_id

        const VENDOR_REGISTRATION_FEE = Number.parseFloat(event?.vendor_charge.toString()!)
        const PLATFORM_FEE = 0.05
        const PERCENT = VENDOR_REGISTRATION_FEE * PLATFORM_FEE
        const totalAmount = VENDOR_REGISTRATION_FEE + PERCENT
        const totalAmountInLowestCurrency = Math.round(totalAmount * 100)

        const paymentLink = await new PaymentService().createPayment({
          email: vendor.email,
          amount: totalAmountInLowestCurrency,
          reference: this.generateReference(),
          metadata: {
            payment_type: 'vendor_registration',
            event_organiser_id: eventOrganiserId,
            event_vendor_id: eventVendor.id,
            event_vendor_service_id: eventVendor.service_id,
            vendor_id: vendor.id.toString(),
            event_id: eventId,
          },
          callback_url: payload.vendorData.callback_url,
        })

        return response.ok({
          success: true,
          data: {
            ...paymentLink.data,
            vendor,
            vendorService,
            eventVendor,
          },
          error: null,
        })
      } catch (error) {
        // If anything fails after creating the vendor service, clean it up
        await vendorService.delete()
        throw error
      }
    } catch (error) {
      console.error('Error in generateQuickVendorPaymentLink:', error)
      return response.internalServerError({
        success: false,
        error: 'An error occurred while generating the payment link',
      })
    }
  }

  async verifyVendorPaymentLink({ request, response, auth }: HttpContext) {
    try {
      const { eventId } = request.params()
      const { reference } = request.body()

      const payment = await new PaymentService().verifyPayment(reference)

      if (payment.status === 'success') {
        return response.ok({
          success: true,
          data: payment,
        })
      }

      return response.badRequest({
        success: false,
        error: 'Payment failed',
      })
    } catch (error) {
      console.error('Error in verifyVendorPaymentLink:', error)
      return response.internalServerError({
        success: false,
        error: 'An error occurred while verifying the payment link',
      })
    }
  }
}
