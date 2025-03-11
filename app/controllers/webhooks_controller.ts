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
import EventVendor from '#models/event_vendor'
import WalletTransaction from '#models/wallet_transaction'
import type { PaystackWebhookEvent } from '../types/paystack.js'
import WalletService from '#services/wallet_service'
import TicketSale, { TicketSaleStatus } from '#models/ticket_sale'

@inject()
export default class WebhooksController {
  constructor(
    private emailService: EmailService,
    private walletService: WalletService
  ) {}

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

    const event = request.body() as PaystackWebhookEvent
    console.log('webhook event', event)

    try {
      switch (event.event) {
        case 'charge.success':
          console.log('charge.success')
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

  private async handleSuccessfulCharge(data: PaystackWebhookEvent['data']) {
    const trx = await db.transaction()
    try {
      const webhookData = data
      const reference = webhookData.reference
      const amount = webhookData.amount / 100 // Convert from kobo to naira
      const metadata = webhookData.metadata

      const paymentType = metadata.payment_type
      const eventOrganiserId = metadata.event_organiser_id
      const eventVendorId = metadata.event_vendor_id
      const eventVendorServiceId = metadata.event_vendor_service_id
      const vendorId = metadata.vendor_id

      console.log('Processing payment:', {
        paymentType,
        reference,
        amount,
        eventOrganiserId,
      })

      if (paymentType === 'vendor_registration') {
        const vendor = await User.find(vendorId)
        if (!vendor) {
          throw new Error('Vendor not found')
        }

        const vendorService = await EventVendor.find(eventVendorServiceId)
        if (!vendorService) {
          throw new Error('Vendor service not found')
        }

        // Update vendor service status
        await trx.from('event_vendors').where('id', vendorService.id).update({
          status: 'approved',
        })

        // Process wallet transaction
        await this.walletService.processTransaction({
          userId: eventOrganiserId,
          amount,
          type: 'credit',
          reference,
          description: 'Vendor registration payment',
          metadata,
          paymentMethod: 'paystack',
        })

        await trx.commit()
      } else if (paymentType === 'ticket') {
        const tickets = metadata.tickets
        console.log('tickets', tickets)
        for (const ticket of tickets) {
          const existingTicket = await Ticket.find(ticket.id)
          if (!existingTicket) {
            throw new Error('Ticket not found')
          }
          existingTicket.refresh()

          // Update ticket quantity sold
          await trx
            .from('tickets')
            .where('id', existingTicket.id)
            .update({
              quantity_sold: existingTicket.quantity_sold + Number(ticket.quantity),
            })

          await TicketSale.create(
            {
              ticket_id: existingTicket.id,
              quantity: Number(ticket.quantity),
              amount_paid: amount,
              payment_reference: reference,
              status: TicketSaleStatus.COMPLETED,
              event_id: existingTicket.event_id,
              buyer_id: eventOrganiserId,
              platform_fee: existingTicket.calculatePlatformFee(amount),

              metadata: {
                payment_type: 'ticket',
                event_organiser_id: eventOrganiserId,
                event_vendor_id: eventVendorId,
                event_vendor_service_id: eventVendorServiceId,
              },
            },
            { client: trx }
          )
        }
        // process wallet transaction
        await this.walletService.processTransaction({
          userId: eventOrganiserId,
          amount,
          type: 'credit',
          reference,
          description: 'Ticket purchase',
          metadata,
          paymentMethod: 'paystack',
          trx,
        })

        await trx.commit()
      }
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }
}
