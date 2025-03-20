import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import NotificationService from '#services/notification_service'
import vine from '@vinejs/vine'
import NotificationToken from '#models/notification_token'
const subscribeValidator = vine.compile(
  vine.object({
    token: vine.string(),
    device_type: vine.enum(['android', 'ios', 'web']),
    user_id: vine.number(),
  })
)

const unsubscribeValidator = vine.compile(
  vine.object({
    token: vine.string(),
  })
)

@inject()
export default class NotificationsController {
  constructor(protected notificationService: NotificationService) {}

  /**
   * Subscribe to push notifications
   */
  public async subscribe({ request, response, auth }: HttpContext) {
    try {
      const payload = await request.validateUsing(subscribeValidator)
      const user = auth.user!
      // get check if user token exists and they are same token and if they are same token and they are same user
      const userToken = await NotificationToken.query()
        .where('user_id', user.id)
        .where('token', payload.token)
        .first()

      if (userToken) {
        return response.json({
          success: false,
          data: null,
          error: 'Token already exists',
          meta: { timestamp: new Date().toISOString() },
        })
      }

      await this.notificationService.subscribe(user.id, payload.token, payload.device_type)

      const token = await this.notificationService.subscribe(
        user.id,
        payload.token,
        payload.device_type
      )

      return response.json({
        success: true,
        data: token,
        error: null,
        meta: { timestamp: new Date().toISOString() },
      })
    } catch (error) {
      return response.json({
        success: false,
        data: null,
        error: error.message,
        meta: { timestamp: new Date().toISOString() },
      })
    }
  }
  /**
   * Unsubscribe from push notifications
   */
  public async unsubscribe({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(unsubscribeValidator)
    const user = auth.user!

    await this.notificationService.unsubscribe(user.id, payload.token)

    return response.json({
      success: true,
      data: null,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }
}
