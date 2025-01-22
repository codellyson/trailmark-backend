import type { HttpContext } from '@adonisjs/core/http'
import EventPayment from '#models/event_payment'
import Event from '#models/event'
import Addon from '#models/addon'
import Wallet from '#models/wallet'
import EscrowAccount from '#models/escrow_account'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import vine from '@vinejs/vine'
import { eventTicketSchema } from '#validators/event_ticket'
import { addonSchema } from '#validators/event_add_on'
import User from '#models/user'

export default class EventPaymentsController {
  private generatePaymentReference() {
    return `PAY-${Math.random().toString(36).substring(2, 15)}`
  }
  /**
   * Process event ticket and addon payment
   */
  private processPaymentValidator = vine.compile(
    vine.object({
      amount: vine.number(),
      payment_method: vine.enum(['card', 'link']),
      metadata: vine.string(),
      addons: vine
        .array(
          vine
            .object({
              quantity: vine.number(),
              addon: addonSchema,
            })
            .optional()
        )
        .optional(),
      tickets: vine
        .array(
          vine
            .object({
              quantity: vine.number(),
              ticket: eventTicketSchema,
            })
            .optional()
        )
        .optional(),
      user: vine.object({
        first_name: vine.string(),
        last_name: vine.string(),
        email: vine.string(),
        phone_number: vine.string(),
      }),
      payment_reference: vine.string(),
    })
  )

  async processPayment({ request, auth, response }: HttpContext) {
    const payload = await this.processPaymentValidator.validate(request.all())
    const eventId = request.param('eventId')
    const paymentReference = payload.payment_reference
    const event = await Event.findOrFail(eventId)

    // Start transaction
    const trx = await db.transaction()

    try {
      // Calculate addon costs and validate availability
      let totalAddonCost = 0
      const addonDetails: any[] = []

      for (const item of payload.addons || []) {
        const addon = await Addon.findOrFail(item?.addon?.id)

        // Check addon availability
        if (!(await addon.checkAvailability(item?.quantity || 0))) {
          throw new Error(`Addon ${addon.name} is not available in requested quantity`)
        }

        // Reserve the addon
        await addon.reserve(item?.quantity || 0)

        // Don't add to totalAmount since it's already included in payload.amount
        addonDetails.push({
          addon_id: addon.id,
          name: addon.name,
          type: addon.type,
          quantity: item?.quantity || 0,
          price: addon.price,
          total: addon.price * (item?.quantity || 0),
          photographer_id: addon.photographer_id,
        })
      }

      // Use payload.amount directly since it already includes both ticket and addon costs
      const totalAmount = payload.amount
      let userId: number | null = null

      if (payload.user) {
        // Generate a random password for the new user
        const password =
          Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

        const user = await User.firstOrCreate(
          { email: payload.user.email },
          {
            ...payload.user,
            password, // Include the password field
            role: 'user', // Explicitly set the role if needed
          }
        )
        userId = user.id
      }

      // Create payment record
      const payment = await EventPayment.addToDatabase(
        {
          customer_id: userId!,
          event_id: Number(event.id),
          amount: totalAmount,
          platform_fee: totalAmount * 0.1, // 10% platform fee
          payment_method: payload.payment_method,
          status: 'pending',
          currency: 'NGN',
          payment_reference: paymentReference,
          metadata: {
            payment_initiated_at: DateTime.now().toISO(),
            addons: addonDetails,
            tickets: payload.tickets || [],
            customer_info: payload.user,
          },
        },
        trx
      )

      // Commit transaction
      await trx.commit()

      return response.json({
        success: true,
        data: {
          payment,
          addons: addonDetails,
          reference: paymentReference,
          metadata: {
            event_id: Number(event.id),
            customer_id: userId!,
            platform_fee: totalAmount * 0.1,
            addons: addonDetails,
            tickets: payload.tickets,
          },
          meta: {
            timestamp: DateTime.now().toISO(),
          },
        },
        error: null,
      })
    } catch (error) {
      console.log(error)
      // Rollback transaction
      await trx.rollback()

      // Cancel addon reservations
      for (const item of payload.addons || []) {
        const addon = await Addon.findOrFail(item?.addon?.id)
        await addon.cancelReservation(item?.quantity || 0)
      }
      console.log(error)
      return response.internalServerError({
        success: false,
        data: null,
        error: {
          code: 'PAYMENT_FAILED',
          message: 'Failed to process payment',
          details: error.message,
        },
      })
    }
  }

  /**
   * Get payment details
   */
  async getPayment({ params, auth, response }: HttpContext) {
    const payment = await EventPayment.query()
      .where('id', params.id)
      .where('customer_id', auth.user!.id)
      .preload('event')
      .firstOrFail()

    return response.json({
      success: true,
      data: payment,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }

  async getEventPayments({ params, auth, response }: HttpContext) {
    const payments = await EventPayment.query()
      .where('event_id', params.eventId)
      .preload('event')
      .firstOrFail()

    return response.json({
      success: true,
      data: payments,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }
}
