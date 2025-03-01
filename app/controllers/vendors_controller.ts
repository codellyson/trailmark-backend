import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import Vendor from '#models/vendor'
import {
  createVendorServiceValidator,
  createVendorValidator,
  updateVendorServiceValidator,
  updateVendorValidator,
} from '#validators/vendor'
import { errors } from '@adonisjs/core'
import User from '#models/user'
import VendorService from '#models/vendor_service'
import { HttpStatusCode } from 'axios'

@inject()
export default class VendorsController {
  /**
   * List all vendors with optional filtering
   */
  async index({ request, response }: HttpContext) {
    const {
      page = 1,
      limit = 10,
      category,
      search,
      sort = 'created_at',
      order = 'desc',
    } = request.qs()

    const query = User.query().where('role', 'vendor').orderBy(sort, order)

    if (category) {
      query.where('category', category)
    }

    if (search) {
      query.where((builder) => {
        builder
          .where('business_name', 'ILIKE', `%${search}%`)
          .orWhere('description', 'ILIKE', `%${search}%`)
      })
    }

    const vendors = await query.paginate(page, limit)
    return response.ok(vendors)
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

    const query = User.query().where('role', 'vendor').orderBy('created_at', 'desc')

    const vendors = await query.paginate(page, limit)

    const vendorsWithServices = await Promise.all(
      vendors.map(async (vendor) => {
        const services = await VendorService.query().where('user_id', vendor.id)
        return { services }
      })
    )

    const transformedVendors = vendorsWithServices.flatMap((vendor) => {
      return {
        services: vendor.services,
      }
    })

    return response.ok(transformedVendors)
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

    const service = await VendorService.create({
      ...payload,
      user_id: vendor.id,
    })

    return response.ok(service)
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
}
