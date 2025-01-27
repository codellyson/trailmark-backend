import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { photographerProfileValidator, photographerSearchValidator } from '#validators/photographer'
import { updatePhotographerProfileValidator } from '#validators/user'
import Wallet from '#models/wallet'
import WalletTransaction from '#models/wallet_transaction'

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
        q.whereJsonSuperset('preferences->specialties', filters.specialties!)
      })
      .if(filters.price_range, (q) => {
        q.whereBetween('preferences->hourly_rate', [
          filters.price_range?.min!,
          filters.price_range?.max!,
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
  async getPhotographer({ params, response, auth }: HttpContext) {
    console.log(auth)
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

  async getPhotographerProfile({ response, auth }: HttpContext) {
    const photographer = await User.query()
      .where('id', auth.user!.id)
      .where('role', 'photographer')
      .preload('wallet')
      .preload('services')
      .preload('escrow', (query) => query.preload('event'))
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
    const payload = await request.validateUsing(updatePhotographerProfileValidator)

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
          ...payload.preferences,
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

  /**
   * Get photographer wallet
   */
  async getPhotographerWallet({ response, auth }: HttpContext) {
    try {
      const wallet = await Wallet.query().where('user_id', auth.user!.id).firstOrFail()
      wallet.load('transactions')

      return response.json({
        success: true,
        data: {
          wallet,
          transactions: wallet.transactions,
        },
        error: null,
        meta: { timestamp: new Date().toISOString() },
      })
    } catch (error) {
      console.error('Error getting photographer wallet:', error)
      return response.internalServerError({
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching the wallet',
        },
        meta: { timestamp: new Date().toISOString() },
      })
    }
  }
}
