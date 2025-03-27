import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { waitlistValidator } from '#validators/waitlist'
import EmailService from '#services/email_service'
import Waitlist from '#models/waitlist'

@inject()
export default class WaitlistController {
  constructor(private emailService: EmailService) {}
  async join({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(waitlistValidator)

      // Check if email already exists in waitlist
      const existingEntry = await Waitlist.findBy('email', payload.email)
      if (existingEntry) {
        return response.badRequest({
          success: false,
          error: 'This email is already on the waitlist',
        })
      }

      // Create waitlist entry
      const waitlistEntry = await Waitlist.create({
        email: payload.email,
        business_name: payload.business_name,
        role: payload.role,
      })
      // send this to the admin
      await this.emailService.sendNewWaitlistSignupToAdminEmail(waitlistEntry)

      // Send notification email
      await this.emailService.sendWaitlistSignupEmail({
        business_name: payload.business_name,
        email: payload.email,
        role: payload.role,
      })

      return response.ok({
        success: true,
        message: 'Successfully joined the waitlist',
        data: {
          email: payload.email,
          business_name: payload.business_name,
          role: payload.role,
        },
      })
    } catch (error) {
      console.error('Error in waitlist signup:', error)
      return response.internalServerError({
        success: false,
        error: 'An error occurred while processing your waitlist signup',
      })
    }
  }
}
