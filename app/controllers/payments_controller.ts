import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import PaystackService from '#services/paystack_service'
import EventPayment from '#models/event_payment'
import { DateTime } from 'luxon'
import env from '#start/env'
import PhotographyService from '#models/photography_service'
import Addon from '#models/addon'
import EscrowAccount from '#models/escrow_account'
import { createHash } from 'node:crypto'
import db from '@adonisjs/lucid/services/db'

@inject()
export default class PaymentsController {
  constructor(protected paystackService: PaystackService) {}

  /**
   * Initialize payment
   */
  async initializePayment({ request, auth, response }: HttpContext) {
    const { eventId, addons = [], amount } = request.only(['eventId', 'addons', 'amount'])

    try {
      // Generate unique reference
      const reference = `PAY-${crypto.randomUUID()}`

      // Initialize payment with Paystack
      const result = await this.paystackService.initializePayment({
        amount,
        email: auth.user!.email,
        reference,
        callbackUrl: `${request.completeUrl()}/verify`,
        metadata: {
          eventId,
          addons,
          userId: auth.user!.id,
        },
      })

      if (!result.success) {
        return response.badRequest({
          success: false,
          error: result.error,
        })
      }

      // Create pending payment record
      await EventPayment.create({
        customer_id: auth.user!.id,
        event_id: eventId,
        amount,
        payment_reference: reference,
        payment_method: 'paystack',
        status: 'pending',
        metadata: {
          addons,
          paystack_authorization_url: result.data.authorization_url,
          payment_initiated_at: DateTime.now().toISO(),
        },
      })

      return response.json({
        success: true,
        data: {
          authorizationUrl: result.data.authorization_url,
          reference,
        },
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        error: 'Payment initialization failed',
      })
    }
  }

  /**
   * Verify payment
   */
  async verifyPayment({ request, response }: HttpContext) {
    const { reference } = request.qs()

    try {
      const payment = await EventPayment.findByOrFail('paymentReference', reference)

      // Verify with Paystack
      const result = await this.paystackService.verifyPayment(reference)

      if (!result.success) {
        payment.status = 'failed'
        await payment.save()

        return response.badRequest({
          success: false,
          error: result.error,
        })
      }

      // Update payment status
      payment.status = result.data.status === 'success' ? 'completed' : 'failed'
      payment.metadata = {
        ...payment.metadata,
        paystack_response: result.data,
        payment_completed_at: DateTime.now().toISO(),
      }
      await payment.save()

      if (payment.status === 'completed') {
        // Process addons and create necessary records
        await this.processCompletedPayment(payment)
      }

      return response.json({
        success: true,
        data: {
          status: payment.status,
          message: payment.status === 'completed' ? 'Payment successful' : 'Payment failed',
        },
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        error: 'Payment verification failed',
      })
    }
  }

  /**
   * Handle webhook
   */
  async handleWebhook({ request, response }: HttpContext) {
    const hash = createHash('sha512')
      .update(JSON.stringify(request.body()))
      .update(env.get('PAYSTACK_WEBHOOK_SECRET')!)
      .digest('hex')

    if (hash !== request.header('x-paystack-signature')) {
      return response.badRequest({ status: 'Invalid signature' })
    }

    const event = request.body()

    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        await this.handleSuccessfulCharge(event.data)
        break
      // Add other event types as needed
    }

    return response.json({ status: 'Webhook processed' })
  }

  /**
   * Process completed payment
   */
  private async processCompletedPayment(payment: EventPayment) {
    // Start transaction
    const trx = await db.transaction()

    try {
      const { addons = [] } = payment.metadata

      // Process each addon
      for (const item of addons) {
        const addon = await Addon.findOrFail(item.addonId)

        if (addon.type === 'photography') {
          // Create photography service
          await PhotographyService.create({
            addon_id: addon.id,
            event_id: payment.event_id,
            photographer_id: addon.photographer_id!,
            price: addon.price,
            status: 'pending',
            event_date: addon.event.date,
          })

          // Create escrow
          await EscrowAccount.create({
            event_id: payment.event_id,
            photographer_id: addon.photographer_id!,
            amount: addon.price,
            status: 'held',
            held_at: DateTime.now(),
            metadata: {
              addon_id: addon.id,
              payment_id: payment.id,
            },
          })
        }

        // Confirm addon sale
        await addon.confirmSale(item.quantity)
      }

      await trx.commit()
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  private async handleSuccessfulCharge(data: any) {
    console.log(data)
  }
}
