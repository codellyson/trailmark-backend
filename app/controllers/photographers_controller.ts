import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { photographerProfileValidator, photographerSearchValidator } from '#validators/photographer'

export default class PhotographersController {
  /**
   * List all active photographers
   */
  async getPhotographers({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const search = request.input('search', '')
    const filters = await request.validateUsing(photographerSearchValidator)

    const query = User.query()
      .where('role', 'photographer')
      .where('status', 'active')
      .if(search, (q) => {
        q.where((subq) => {
          subq
            .whereILike('first_name', `%${search}%`)
            .orWhereILike('last_name', `%${search}%`)
            .orWhereILike('business_name', `%${search}%`)
        })
      })
      .if(filters.specialties, (q) => {
        q.whereJsonSuperset('preferences->specialties', filters.specialties)
      })
      .if(filters.price_range, (q) => {
        q.whereBetween('preferences->hourly_rate', [
          filters.price_range.min,
          filters.price_range.max,
        ])
      })
      .if(filters.location, (q) => {
        q.whereILike('business_address', `%${filters.location}%`)
      })

    const photographers = await query.paginate(page, limit)

    return response.json({
      success: true,
      data: photographers,
      error: null,
      meta: {
        pagination: photographers.getMeta(),
        timestamp: new Date().toISOString(),
      },
    })
  }

  /**
   * Get photographer profile
   */
  async getPhotographer({ params, response }: HttpContext) {
    const photographer = await User.query()
      .where('id', params.id)
      .where('role', 'photographer')
      .firstOrFail()

    return response.json({
      success: true,
      data: photographer,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }

  /**
   * Update photographer profile
   */
  async updateProfile({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(photographerProfileValidator)

    if (auth.user?.role !== 'photographer') {
      return response.forbidden({
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Only photographers can update their profile',
        },
        meta: { timestamp: new Date().toISOString() },
      })
    }

    const photographer = await User.findOrFail(auth.user.id)
    await photographer
      .merge({
        ...payload,
        preferences: {
          ...photographer.preferences,
          equipment: payload.equipment,
          specialties: payload.specialties,
          hourly_rate: payload.hourly_rate,
          availability: payload.availability,
        },
      })
      .save()

    return response.json({
      success: true,
      data: photographer,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }
}
