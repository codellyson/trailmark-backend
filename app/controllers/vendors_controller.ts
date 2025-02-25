import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import Vendor from '#models/vendor'
import { createVendorValidator, updateVendorValidator } from '#validators/vendor'
import { errors } from '@adonisjs/core'

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

    const query = Vendor.query().preload('user').orderBy(sort, order)

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

  /**
   * Create a new vendor
   */
  async store({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(createVendorValidator)
    const vendor = await Vendor.create({
      ...payload,
      user_id: auth.user!.id,
    })

    await vendor.refresh()
    await vendor.load('user')
    return response.created(vendor)
  }

  /**
   * Show vendor details
   */
  async show({ params, response }: HttpContext) {
    const vendor = await Vendor.findOrFail(params.id)
    await vendor.load('user')
    await vendor.load('events')
    return response.ok(vendor)
  }

  /**
   * Update vendor details
   */
  async update({ params, request, response, auth }: HttpContext) {
    const vendor = await Vendor.findOrFail(params.id)

    // Only allow vendor owner or admin to update
    if (vendor.user_id !== auth.user!.id && !auth.user!.isAdmin) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Not authorized to update this vendor')
    }

    const payload = await request.validateUsing(updateVendorValidator)
    await vendor.merge(payload).save()
    await vendor.refresh()
    await vendor.load('user')
    return response.ok(vendor)
  }

  /**
   * Delete a vendor
   */
  async destroy({ params, response, auth }: HttpContext) {
    const vendor = await Vendor.findOrFail(params.id)

    // Only allow vendor owner or admin to delete
    if (vendor.user_id !== auth.user!.id && !auth.user!.isAdmin) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Not authorized to delete this vendor')
    }

    await vendor.delete()
    return response.noContent()
  }

  /**
   * Update vendor status
   */
  async updateStatus({ params, request, response, auth }: HttpContext) {
    if (!auth.user!.isAdmin) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Only admins can update vendor status')
    }

    const vendor = await Vendor.findOrFail(params.id)
    const { status } = await request.validateUsing(updateVendorValidator)

    await vendor.merge({ status }).save()
    await vendor.refresh()
    return response.ok(vendor)
  }

  /**
   * Get vendor reviews
   */
  async getReviews({ params, request, response }: HttpContext) {
    const { page = 1, limit = 10 } = request.qs()
    const vendor = await Vendor.findOrFail(params.id)

    const reviews = await vendor
      .related('events')
      .query()
      .whereNotNull('rating')
      .whereNotNull('review')
      .orderBy('created_at', 'desc')
      .paginate(page, limit)

    return response.ok(reviews)
  }

  /**
   * Search vendors by services
   */
  async searchByServices({ request, response }: HttpContext) {
    const { services, page = 1, limit = 10 } = request.qs()

    if (!services || !Array.isArray(services)) {
      throw new errors.E_VALIDATION_FAILURE('Services must be an array')
    }

    const vendors = await Vendor.query()
      .whereRaw('services ?| array[:services]', { services })
      .preload('user')
      .paginate(page, limit)

    return response.ok(vendors)
  }
}
