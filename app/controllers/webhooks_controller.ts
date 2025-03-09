import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { createHash } from 'node:crypto'
import env from '#start/env'
import Event from '#models/event'
import Wallet from '#models/wallet'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import Booking, { AttendeeDetails } from '#models/booking'
import Ticket, { TicketType } from '#models/ticket'
import EmailService from '#services/email_service'
import User from '#models/user'

@inject()
export default class WebhooksController {
  constructor(private emailService: EmailService) {}

  async paystackWebhook({ request, response }: HttpContext) {
    // Verify webhook signature
    const hash = createHash('sha512')
      .update(JSON.stringify(request.body()))
      .update(env.get('PAYSTACK_WEBHOOK_SECRET')!)
      .digest('hex')

    // console.log('Webhook received:', {
    //   body: request.body(),
    //   signature: request.header('x-paystack-signature'),
    //   calculatedHash: hash,
    // })

    //TODO: Uncomment this when ready to use
    // if (hash !== request.header('x-paystack-signature')) {
    //   return response.badRequest({ status: 'Invalid signature' })
    // }

    const event = request.body()

    try {
      switch (event.event) {
        case 'charge.success':
          await this.handleSuccessfulCharge(event.data)
          break
        default:
          return response.status(200).send({ status: 'Webhook processed' })
      }
    } catch (error) {
      console.error('Webhook processing error:', {
        error,
        eventType: event.event,
        reference: event.data?.reference,
        paymentData: event.data,
      })
      return response.status(200).send({ status: 'Webhook processing failed' })
    }
  }

  private async handleSuccessfulCharge(data: any) {
    const trx = await db.transaction()
  }
}
