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
import SocialSharingService from '#services/social_sharing_service'

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
        const vendorService = await EventVendor.query()
          .where('service_id', eventVendorServiceId)
          .where('vendor_id', vendorId)
          .first()
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

        // Send vendor registration confirmation
        await this.emailService.sendVendorRegistrationConfirmation(vendor, vendorService)

        // Generate QR code URL for vendor pass
        const qrCodeUrl = await new SocialSharingService().generateEventQR(
          await Event.findOrFail(vendorService.event_id)
        )

        // Send vendor pass
        await this.emailService.sendVendorPass({
          vendor,
          vendorService,
          event: await Event.findOrFail(vendorService.event_id),
          reference,
          qrCodeUrl: qrCodeUrl.dataUrl,
        })
      } else if (paymentType === 'ticket') {
        const event = await Event.find(metadata.event_id)
        if (!event) {
          throw new Error('Event not found')
        }

        const tickets = metadata.tickets
        console.log('Processing ticket payment:', {
          tickets,
          eventOrganiserId,
          amount,
          reference,
        })

        // Calculate total platform fee and organizer earnings
        let totalPlatformFee = 0
        let totalOrganizerEarnings = 0

        for (const ticket of tickets) {
          const ticketAmount = ticket.price * ticket.quantity
          const platformFee = ticket.platform_fee * ticket.quantity
          totalPlatformFee += platformFee
          totalOrganizerEarnings += ticketAmount - platformFee
        }

        console.log('Processing wallet transaction for event organizer:', {
          eventOrganiserId,
          totalOrganizerEarnings,
          totalPlatformFee,
          reference,
        })

        // Credit only the organizer's earnings to their wallet
        const walletResult = await this.walletService.processTransaction({
          userId: eventOrganiserId,
          amount: totalOrganizerEarnings,
          type: 'credit',
          reference,
          description: 'Ticket sales earnings',
          metadata: {
            ...metadata,
            total_amount: amount,
            platform_fee: totalPlatformFee,
            organizer_earnings: totalOrganizerEarnings,
          },
          paymentMethod: 'paystack',
          trx,
        })

        console.log('Wallet transaction result:', walletResult)

        // Only process ticket sales if wallet transaction was successful
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

          const ticketAmount = ticket.price * ticket.quantity
          const platformFee = ticket.platform_fee * ticket.quantity

          await TicketSale.create(
            {
              ticket_id: existingTicket.id,
              quantity: Number(ticket.quantity),
              amount_paid: ticketAmount,
              payment_reference: reference,
              status: TicketSaleStatus.COMPLETED,
              event_id: existingTicket.event_id,
              buyer_id: eventOrganiserId,
              platform_fee: platformFee,
              metadata: {
                payment_type: 'ticket',
                event_organiser_id: eventOrganiserId,
                event_vendor_id: eventVendorId,
                event_vendor_service_id: eventVendorServiceId,
                total_amount: ticketAmount,
                platform_fee: platformFee,
                organizer_earnings: ticketAmount - platformFee,
              },
            },
            { client: trx }
          )
        }

        await trx.commit()

        // Send payment confirmation email
        await this.emailService.sendPaymentConfirmation({
          id: webhookData.id,
          reference: reference,
          amount: amount,
          metadata: metadata,
          event: event,
          customer: {
            email: metadata.user,
            first_name: metadata.user_info?.first_name || '',
            last_name: metadata.user_info?.last_name || '',
          },
        })

        // Generate QR code URL for e-ticket
        const qrCodeUrl = await new SocialSharingService().generateEventQR(event)

        // Send e-ticket email
        await this.emailService.sendETicket({
          customer: {
            email: metadata.user,
            first_name: metadata.user_info?.first_name || '',
            last_name: metadata.user_info?.last_name || '',
          },
          event,
          tickets: metadata.tickets,
          reference,
          qrCodeUrl: qrCodeUrl.dataUrl,
        })
      }
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }
}
