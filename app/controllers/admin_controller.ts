import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import EmailService from '#services/email_service'
import vine from '@vinejs/vine'

const updateUserStatusValidator = vine.compile(
  vine.object({
    status: vine.enum(['active', 'inactive', 'suspended']),
  })
)

@inject()
export default class AdminController {
  constructor(private emailService: EmailService) {}

  /**
   * Update user status
   */
  async updateUserStatus({ request, response, params }: HttpContext) {
    const payload = await request.validateUsing(updateUserStatusValidator)
    const user = await User.findOrFail(params.id)

    const oldStatus = user.status
    user.status = payload.status
    await user.save()

    // Send email notification about status change
    await this.emailService.sendAccountStatusChangeNotification(user, oldStatus, payload.status)

    return response.json({
      success: true,
      data: user,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }
}
