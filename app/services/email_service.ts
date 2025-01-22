import env from '#start/env'
import { DateTime } from 'luxon'
import EventPayment from '#models/event_payment'
import Booking from '#models/booking'
import User from '#models/user'
import EscrowAccount from '#models/escrow_account'
import Addon from '#models/addon'
import Event from '#models/event'

import mail from '@adonisjs/mail/services/main'
import { MailService } from '@adonisjs/mail/types'
import { inject } from '@adonisjs/core/container'

@inject()
export default class EmailService {
  from: { address: string | undefined; name: string | undefined }
  mailer: MailService
  constructor() {
    this.from = {
      address: env.get('MAIL_FROM_ADDRESS'),
      name: env.get('MAIL_FROM_NAME'),
    }
    this.mailer = mail
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(payment: EventPayment) {
    try {
      // Get email from metadata if customer relation is not loaded
      const recipientEmail = payment.customer?.email || payment.metadata?.customer_info?.email

      if (!recipientEmail) {
        console.error('No recipient email found:', {
          paymentId: payment.id,
          metadata: payment.metadata,
          customer: payment.customer,
        })
        throw new Error('Missing recipient email address')
      }

      console.log('Sending payment confirmation to:', recipientEmail)

      await this.mailer.send((message) => {
        message
          .from(this.from.address!, this.from.name)
          .subject(`Payment Confirmation - ${payment.event.title}`)
          .to(recipientEmail)
          .htmlView('mails/payment_confirmation', {
            payment,
            user: payment.customer || payment.metadata.customer_info,
            event: payment.event,
            bookingUrl: `${env.get('APP_URL')}/bookings/${payment.id}`,
          })
      })

      console.log('Payment confirmation email sent successfully')
    } catch (error) {
      console.error('Failed to send payment confirmation email:', {
        error,
        paymentId: payment.id,
        metadata: payment.metadata,
      })
      throw error
    }
  }

  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmation(booking: Booking) {
    await booking.load('event')
    await booking.load('user')

    await this.mailer.send((message) => {
      message
        .subject(`Booking Confirmation - ${booking.event.title}`)
        .to(booking.user.email)
        .from(this.from.address!, this.from.name)
        .htmlView('mails/booking_confirmation', {
          booking,
          user: booking.user,
          event: booking.event,
          bookingUrl: `${env.get('APP_URL')}/bookings/${booking.id}`,
          logo: env.get('APP_LOGO_URL'),
          title: 'Booking Confirmation',
        })
    })
  }

  /**
   * Send photographer assignment notification
   */
  async sendPhotographerAssignment(event: Event, photographer: User, addon: Addon) {
    await this.mailer.send((message) => {
      message
        .subject(`New Photography Assignment - ${event.name}`)
        .to(photographer.email)
        .htmlView('mails/photographer_assignment', {
          photographer,
          event,
          addon,
          confirmationUrl: `${env.get('APP_URL')}/photographer/assignments/${event.id}/confirm`,
          logo: env.get('APP_LOGO_URL'),
          title: 'Photography Assignment',
        })
    })
  }

  /**
   * Send escrow release notification
   */
  async sendEscrowRelease(escrow: EscrowAccount) {
    await escrow.load('event')
    await escrow.load('photographer')

    await this.mailer.send((message) => {
      message
        .subject('Payment Released from Escrow')
        .to(escrow.photographer.email)
        .htmlView('mails/escrow_release', {
          photographer: escrow.photographer,
          event: escrow.event,
          escrow,
          walletUrl: `${env.get('APP_URL')}/photographer/wallet`,
          logo: env.get('APP_LOGO_URL'),
          title: 'Escrow Release Notification',
        })
    })
  }

  /**
   * Send refund notification
   */
  async sendRefundNotification(payment: EventPayment) {
    await payment.load('customer')
    await payment.load('event')

    await this.mailer.send((message) => {
      message
        .subject('Refund Processed')
        .to(payment.customer.email)
        .htmlView('mails/refund_notification', {
          payment,
          user: payment.customer,
          event: payment.event,
          logo: env.get('APP_LOGO_URL'),
          title: 'Refund Notification',
        })
    })
  }

  /**
   * Send event reminder
   */
  async sendEventReminder(booking: Booking) {
    await booking.load('event')
    await booking.load('user')

    await this.mailer.send((message) => {
      message
        .subject(`Reminder: ${booking.event.title} Tomorrow`)
        .to(booking.user.email)
        .htmlView('mails/event_reminder', {
          booking,
          user: booking.user,
          event: booking.event,
          eventDetailsUrl: `${env.get('APP_URL')}/events/${booking.event.id}`,
          logo: env.get('APP_LOGO_URL'),
          title: 'Event Reminder',
        })
    })
  }

  /**
   * Send photography service completion notification
   */
  async sendPhotographyCompletion(event: Event, photographer: User, addon: Addon) {
    await event.load('organizer')

    await this.mailer.send((message) => {
      message
        .subject(`Photography Service Completed - ${event.title}`)
        .to(event.organizer.email)
        .htmlView('mails/photography_completion', {
          organizer: event.organizer,
          event,
          photographer,
          addon,
          reviewUrl: `${env.get('APP_URL')}/organizer/events/${event.id}/review-photography`,
          logo: env.get('APP_LOGO_URL'),
          title: 'Photography Service Completion',
        })
    })
  }

  /**
   * Send low ticket inventory alert to organizer
   */
  async sendLowTicketInventoryAlert(event: Event, ticketType: string, remainingCount: number) {
    await event.load('organizer')

    await this.mailer.send((message) => {
      message
        .subject(`Low Ticket Inventory Alert - ${event.name}`)
        .to(event.organizer.email)
        .htmlView('mails/low_ticket_inventory', {
          event,
          organizer: event.organizer,
          ticketType,
          remainingCount,
          manageUrl: `${env.get('APP_URL')}/organizer/events/${event.id}/tickets`,
          logo: env.get('APP_LOGO_URL'),
          title: 'Low Ticket Inventory Alert',
        })
    })
  }
}
