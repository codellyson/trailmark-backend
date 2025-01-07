import type { HttpContext } from '@adonisjs/core/http'
import { createPaymentIntentValidator } from '#validators/payment'
import Payment from '#models/payment'
import Booking from '#models/booking'
import { stripe } from '#services/stripe'
import env from '#start/env'
import { DateTime } from 'luxon'

export default class PaymentsController {
  /**
   * Create payment intent
   */
  async createIntent({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createPaymentIntentValidator)
    const booking = await Booking.findOrFail(payload.bookingId)

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.totalAmount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        bookingId: booking.id,
        eventId: booking.eventId,
      },
    })

    // Create local payment record
    const payment = await Payment.create({
      bookingId: booking.id,
      stripePaymentIntentId: paymentIntent.id,
      amount: booking.totalAmount,
      status: 'pending',
      stripeResponse: paymentIntent,
    })

    return response.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentId: payment.id,
      },
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }

  /**
   * Handle Stripe webhook
   */
  async webhook({ request, response }: HttpContext) {
    const signature = request.header('stripe-signature')

    if (!signature) {
      return response.badRequest({
        success: false,
        data: null,
        error: {
          code: 'INVALID_SIGNATURE',
          message: 'Missing Stripe signature',
        },
        meta: { timestamp: new Date().toISOString() },
      })
    }

    try {
      const event = stripe.webhooks.constructEvent(
        request.raw()!,
        signature,
        env.get('STRIPE_WEBHOOK_SECRET')!
      )

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object)
          break
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object)
          break
        case 'charge.refunded':
          await this.handleRefund(event.data.object)
          break
      }

      return response.json({
        success: true,
        data: null,
        error: null,
        meta: { timestamp: new Date().toISOString() },
      })
    } catch (error) {
      return response.badRequest({
        success: false,
        data: null,
        error: {
          code: 'WEBHOOK_ERROR',
          message: error.message,
        },
        meta: { timestamp: new Date().toISOString() },
      })
    }
  }

  private async handlePaymentSuccess(paymentIntent: any) {
    const payment = await Payment.findByOrFail('stripePaymentIntentId', paymentIntent.id)
    const booking = await payment.related('booking').query().firstOrFail()

    await payment
      .merge({
        status: 'succeeded',
        paidAt: DateTime.fromJSDate(new Date()),
        stripeResponse: paymentIntent,
      })
      .save()

    await booking.merge({ status: 'confirmed' }).save()
  }

  private async handlePaymentFailure(paymentIntent: any) {
    const payment = await Payment.findByOrFail('stripePaymentIntentId', paymentIntent.id)

    await payment
      .merge({
        status: 'failed',
        stripeResponse: paymentIntent,
      })
      .save()
  }

  private async handleRefund(charge: any) {
    const payment = await Payment.findByOrFail('stripePaymentIntentId', charge.payment_intent)
    const booking = await payment.related('booking').query().firstOrFail()

    await payment
      .merge({
        status: 'refunded',
        refundedAt: DateTime.fromJSDate(new Date()),
        stripeResponse: charge,
      })
      .save()

    await booking.merge({ status: 'refunded' }).save()
  }
}
