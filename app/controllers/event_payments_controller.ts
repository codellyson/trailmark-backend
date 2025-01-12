import type { HttpContext } from '@adonisjs/core/http'
import EventPayment from '#models/event_payment'
import Event from '#models/event'
import Addon from '#models/addon'
import Wallet from '#models/wallet'
import EscrowAccount from '#models/escrow_account'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

export default class EventPaymentsController {
  /**
   * Process event ticket and addon payment
   */
  async processPayment({ request, auth, response }: HttpContext) {
    const {
      eventId,
      amount,
      paymentMethod,
      addons = [], // Array of { addonId, quantity }
    } = request.only(['eventId', 'amount', 'paymentMethod', 'addons'])

    const event = await Event.findOrFail(eventId)

    // Start transaction
    const trx = await db.transaction()

    try {
      // Calculate addon costs and validate availability
      let totalAddonCost = 0
      const addonDetails = []

      for (const item of addons) {
        const addon = await Addon.findOrFail(item.addonId)

        // Check addon availability
        if (!(await addon.checkAvailability(item.quantity))) {
          throw new Error(`Addon ${addon.name} is not available in requested quantity`)
        }

        // Reserve the addon
        await addon.reserve(item.quantity)

        totalAddonCost += addon.price * item.quantity
        addonDetails.push({
          addon_id: addon.id,
          type: addon.type,
          quantity: item.quantity,
          unit_price: addon.price,
          total: addon.price * item.quantity,
          photographer_id: addon.photographer_id,
        })
      }

      const totalAmount = amount + totalAddonCost

      // Create payment record
      const payment = await EventPayment.create(
        {
          customer_id: auth.user!.id,
          event_id: Number(event.id),
          amount: totalAmount,
          platform_fee: totalAmount * 0.1, // 10% platform fee
          payment_method: paymentMethod,
          status: 'processing',
          metadata: {
            payment_initiated_at: new Date().toISOString(),
            addons: addonDetails,
          },
        },
        { client: trx }
      )

      // Process payment through payment gateway
      // const paymentResult = await processPaymentGateway(...)

      // Handle photographer fees and escrow for photography addons
      for (const detail of addonDetails) {
        if (detail.type === 'photography' && detail.photographer_id) {
          const photographerFee = detail.total

          // Create escrow for photographer payment
          await EscrowAccount.create(
            {
              event_id: Number(event.id),
              photographer_id: detail.photographer_id,
              amount: photographerFee,
              status: 'held',
              held_at: DateTime.now(),
              release_date: event.end_date,
              metadata: {
                payment_id: payment.id,
                addon_id: detail.addon_id,
                customer_id: auth.user!.id,
                completed_at: DateTime.now(),
                deliverables: [],
              },
            },
            { client: trx }
          )

          // Confirm addon sale
          const addon = await Addon.findOrFail(detail.addon_id)
          await addon.confirmSale(detail.quantity)
        }
      }

      // Update organizer's wallet
      const organizerShare = totalAmount - totalAmount * 0.1 // Minus platform fee
      const organizerWallet = await Wallet.firstOrCreate(
        { user_id: event.organizer_id },
        {
          user_id: event.organizer_id,
          available_balance: 0,
          pending_balance: 0,
        }
      )

      await organizerWallet.addTransaction({
        type: 'ticket_sale_revenue',
        amount: organizerShare,
        status: 'completed',
        reference_type: 'event_payment',
        reference_id: payment.id,
        metadata: {
          event_id: Number(event.id),
          customer_id: auth.user!.id,
          platform_fee: totalAmount * 0.1,
          addons: addonDetails,
        },
      })

      // Update payment status
      payment.status = 'completed'
      payment.paid_at = new Date()
      await payment.save()

      // Commit transaction
      await trx.commit()

      return response.json({
        success: true,
        data: {
          payment,
          addons: addonDetails,
          ticketConfirmation: {
            eventId: event.id,
            amount: totalAmount,
            paymentId: payment.id,
            timestamp: new Date().toISOString(),
          },
        },
        error: null,
      })
    } catch (error) {
      // Rollback transaction
      await trx.rollback()

      // Cancel addon reservations
      for (const item of addons) {
        const addon = await Addon.findOrFail(item.addonId)
        await addon.cancelReservation(item.quantity)
      }

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
}
