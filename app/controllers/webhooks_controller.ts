import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { createHash } from 'node:crypto'
import env from '#start/env'
import EventPayment from '#models/event_payment'
import Event from '#models/event'
import Wallet from '#models/wallet'
import EscrowAccount, { EscrowAccountStatus } from '#models/escrow_account'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import Booking, { AttendeeDetails } from '#models/booking'
import Ticket, { TicketType } from '#models/ticket'
import EmailService from '#services/email_service'
import User from '#models/user'
import Addon from '#models/addon'

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

    try {
      const payment = await EventPayment.query()
        .where('payment_reference', data.reference)
        .where('status', 'pending')
        .preload('customer')
        .preload('event')
        .firstOrFail()

      // Verify we have the customer email
      if (!payment.customer?.email) {
        console.error('Missing customer email:', {
          paymentId: payment.id,
          customerId: payment.customer_id,
        })
        throw new Error('Missing customer email address')
      }

      // Log the data we're working with
      console.log('Payment details:', {
        id: payment.id,
        reference: payment.payment_reference,
        customerEmail: payment.customer.email,
        eventName: payment.event?.title,
      })
      console.log(payment.metadata, 'payment.metadata')
      // Update payment status first
      payment.status = 'completed'
      payment.paid_at = DateTime.now()
      payment.metadata = {
        ...payment.metadata,
        gateway_response: data,
        payment_completed_at: DateTime.now().toISO(),
      }
      await payment.save()

      try {
        // Create booking
        const metadataAddons = payment.metadata.addons || []
        const metadataTickets = payment.metadata.tickets || []

        const stringifiedMetadataAddons = JSON.stringify(
          metadataAddons?.map(
            // @ts-expect-error - need to fix this type error
            (addon, { quantity }: { addon: Addon; quantity: number }) => {
              return {
                addon_id: addon.id.toString(),
                addon_name: addon.name,
                quantity: quantity,
                unit_price: addon.price,
                subtotal: addon.price * quantity,
              }
            }
          ) || []
        )
        const stringifiedMetadataTickets = JSON.stringify(
          metadataTickets?.map(
            // @ts-expect-error - need to fix this type error
            ({ ticket, quantity }: { ticket: Ticket; quantity: number }) => ({
              ticket_id: ticket.id,
              ticket_name: ticket.name,
              quantity: quantity,
              unit_price: ticket.price,
              subtotal: ticket.price * quantity,
            })
          ) || []
        )

        // Add debug logging
        console.log(
          'Payment Details:',
          typeof data === 'string' ? data : JSON.stringify(data || {})
        )
        console.log(
          'Selected Addons:',
          typeof stringifiedMetadataAddons === 'string'
            ? stringifiedMetadataAddons
            : JSON.stringify(stringifiedMetadataAddons || [])
        )
        console.log(
          'Selected Tickets:',
          typeof stringifiedMetadataTickets === 'string'
            ? stringifiedMetadataTickets
            : JSON.stringify(stringifiedMetadataTickets || [])
        )

        // Ensure proper JSON formatting
        const bookingData = {
          user_id: payment.customer_id,
          event_id: payment.event_id,
          booking_reference: `BK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          status: 'confirmed',
          total_amount: payment.amount,
          currency: payment.currency || 'NGN',
          payment_status: 'completed',
          payment_reference: payment.payment_reference,
          payment_details: JSON.stringify(typeof data === 'string' ? JSON.parse(data) : data),
          selected_tickets: JSON.stringify(
            typeof stringifiedMetadataTickets === 'string'
              ? JSON.parse(stringifiedMetadataTickets)
              : stringifiedMetadataTickets
          ),
          selected_addons: JSON.stringify(
            typeof stringifiedMetadataAddons === 'string'
              ? JSON.parse(stringifiedMetadataAddons)
              : stringifiedMetadataAddons
          ),
          attendee_details: JSON.stringify(payment.metadata.customer_info),
        }

        // Add validation check
        try {
          // Verify each JSON field is valid
          JSON.parse(bookingData.payment_details)
          JSON.parse(bookingData.selected_tickets)
          JSON.parse(bookingData.selected_addons)
        } catch (e) {
          console.error('Invalid JSON format:', e)
          throw e
        }

        // Log the final data
        console.log('Final booking data:', bookingData)

        const booking = await Booking.create(bookingData as any)

        console.log(
          'Booking created successfully:',
          booking.booking_reference,
          JSON.stringify(booking, null, 2)
        )

        // Update ticket counts after booking creation
        if (payment.metadata.tickets?.length) {
          for (const ticketData of payment.metadata.tickets) {
            console.log('Ticket data:', ticketData)
            // @ts-expect-error - need to fix this type error
            const ticket = ticketData.ticket // Access the ticket object correctly
            if (!ticket?.id) {
              console.warn('Invalid ticket data:', ticketData)
              continue
            }

            const ticketModel = await Ticket.findOrFail(ticket.id)
            ticketModel.sold_count += ticketData.quantity
            if (ticketModel.capacity && ticketModel.sold_count >= ticketModel.capacity) {
              ticketModel.status = 'sold_out'
            }
            await ticketModel.save()
          }
        }

        // Process photographer fees if any
        const { addons = [] } = payment.metadata
        for (const addon of addons) {
          if (addon.type === 'photography' && addon.photographer_id) {
            const totalPhotographyFee = addons.reduce((acc, curr) => acc + curr.price, 0)
            await EscrowAccount.createMany(
              [
                {
                  currency: payment.currency,
                  event_id: payment.event_id!,
                  photographer_id: addon.photographer_id!,
                  amount: totalPhotographyFee,
                  status: EscrowAccountStatus.HELD,
                  held_at: DateTime.now(),
                  release_date: DateTime.fromJSDate(new Date(payment.event.date as any)).plus({
                    days: 7,
                  }), // or use event date
                  metadata: {
                    payment_id: payment.id,
                    booking_id: booking.id,
                    addon_id: addon.id,
                    customer_id: payment.customer_id,
                    completed_at: DateTime.now().toISO(),
                  },
                },
              ],
              { client: trx }
            )
          }
        }

        // Update organizer's wallet section
        try {
          const organizerShare = payment.amount - payment.platform_fee

          // Log the organizer details
          console.log('Creating wallet for organizer:', {
            organizer_id: payment.event.organizer_id,
            payment_id: payment.id,
            event_id: payment.event_id,
          })

          // Create or find wallet with transaction
          const organizerWallet = await Wallet.firstOrCreate(
            {
              user_id: payment.event.organizer_id,
            },
            {
              user_id: payment.event.organizer_id,
              available_balance: 0,
              pending_balance: 0,
            },
            { client: trx }
          )

          // Verify wallet was created/found
          if (!organizerWallet || !organizerWallet.id) {
            throw new Error(
              `Failed to create/find wallet for organizer ${payment.event.organizer_id}`
            )
          }

          // Log wallet details
          console.log('Wallet details:', {
            wallet_id: organizerWallet.id,
            user_id: organizerWallet.user_id,
            available_balance: organizerWallet.available_balance,
          })

          // Update wallet balance first
          organizerWallet.available_balance += organizerShare
          await organizerWallet.save()

          // Create transaction with explicit wallet reference
          const transaction = await organizerWallet.related('transactions').create(
            {
              type: 'event_payment_received',
              amount: organizerShare,
              status: 'completed',
              reference_type: 'event_payment',
              reference_id: payment.id,
              balance_after: organizerWallet.available_balance,
              fee: payment.platform_fee,
              currency: payment.currency,
              processed_at: DateTime.now(),
              metadata: {
                event_id: payment.event_id,
                booking_id: booking.id,
                customer_id: payment.customer_id,
                platform_fee: payment.platform_fee,
                addons: payment.metadata.addons,
                tickets: payment.metadata.tickets,
              },
            },
            { client: trx }
          )

          // Log transaction details
          console.log('Transaction created:', {
            transaction_id: transaction.id,
            wallet_id: organizerWallet.id,
            amount: organizerShare,
          })

          await trx.commit()
          console.log('Transaction committed successfully')
        } catch (error) {
          console.error('Wallet operation error:', {
            error,
            organizer_id: payment.event.organizer_id,
            payment_id: payment.id,
            stack: error.stack,
          })
          await trx.rollback()
          throw error
        }

        // Send confirmation emails
        await this.emailService.sendPaymentConfirmation(payment)
        console.log('Payment confirmation email sent')
        await this.emailService.sendBookingConfirmation(booking)
        console.log('Booking confirmation email sent')
        await this.emailService.sendTicket(booking)
        console.log('Ticket email sent')
        // If photography addon exists, send photographer assignment
        const photographyAddon = payment.metadata.addons?.find(
          (addon) => addon.type === 'photography'
        )
        if (photographyAddon) {
          const photographer = await User.findOrFail(photographyAddon.photographer_id)
          await this.emailService.sendPhotographerAssignment(
            payment.event,
            photographer,
            photographyAddon
          )
        }
      } catch (error) {
        console.error('Error creating booking:', {
          error,
          payment_id: payment.id,
          customer_id: payment.customer_id,
          metadata: payment.metadata, // Log full metadata for debugging
        })
        throw error
      }
    } catch (error) {
      console.error('Webhook processing error:', error)
      await trx.rollback()
      throw error
    }
  }
}
