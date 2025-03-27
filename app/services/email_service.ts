import env from '#start/env'
import Booking from '#models/booking'
import User from '#models/user'

import Event from '#models/event'
import WalletTransaction from '#models/wallet_transaction'

import mail from '@adonisjs/mail/services/main'
import { MailService } from '@adonisjs/mail/types'
import { inject } from '@adonisjs/core/container'
import EventVendor from '#models/event_vendor'
import Waitlist from '#models/waitlist'

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
   * Check if we should send email to user based on their preferences
   */
  private shouldSendEmail(user: User): boolean {
    // If preferences don't exist or email notifications setting doesn't exist, default to true
    // if (!user.preferences || user.preferences.receive_email_notifications === undefined) {
    //   return true
    // }
    // return user.preferences.receive_email_notifications

    return true
  }

  /**
   * Send welcome email
   */
  async sendWelcome(user: User) {
    if (!this.shouldSendEmail(user)) return

    await this.mailer.send((message) => {
      message
        .subject('Welcome to our platform')
        .to(user.email!)
        .from(this.from.address!, this.from.name)
        .htmlView('mails/successful_registration', {
          name: user.first_name!,
          user,
          socialLinks: {
            facebook: env.get('FACEBOOK_URL'),
            twitter: env.get('TWITTER_URL'),
            instagram: env.get('INSTAGRAM_URL'),
          },
          links: {
            privacy: env.get('PRIVACY_URL'),
            terms: env.get('TERMS_URL'),
            unsubscribe: env.get('UNSUBSCRIBE_URL'),
          },
          socialIcons: {
            facebook: env.get('FACEBOOK_LOGO_URL'),
            twitter: env.get('TWITTER_LOGO_URL'),
            instagram: env.get('INSTAGRAM_LOGO_URL'),
          },
          logo: env.get('APP_LOGO_URL'),
          title: 'Welcome to our platform',
        })
    })
  }

  /**
   * Send password change notification
   */
  async sendPasswordChangeNotification(user: User) {
    if (!this.shouldSendEmail(user)) return

    await this.mailer.send((message) => {
      message
        .subject('Password Changed Successfully')
        .to(user.email)
        .from(this.from.address!, this.from.name)
        .htmlView('mails/password_change', {
          user,
          timestamp: new Date().toISOString(),
          logo: env.get('APP_LOGO_URL'),
        })
    })
  }

  /**
   * Send account status change notification
   */
  async sendAccountStatusChangeNotification(user: User, oldStatus: string, newStatus: string) {
    if (!this.shouldSendEmail(user)) return

    await this.mailer.send((message) => {
      message
        .subject('Account Status Update')
        .to(user.email)
        .from(this.from.address!, this.from.name)
        .htmlView('mails/account_status_change', {
          user,
          oldStatus,
          newStatus,
          logo: env.get('APP_LOGO_URL'),
        })
    })
  }

  /**
   * Send wallet balance update notification
   */
  async sendWalletUpdateNotification(user: User, transaction: WalletTransaction) {
    if (!this.shouldSendEmail(user)) return

    await user.load('wallet')

    await this.mailer.send((message) => {
      message
        .subject('Wallet Balance Update')
        .to(user.email)
        .from(this.from.address!, this.from.name)
        .htmlView('mails/wallet_update', {
          user,
          transaction,
          newBalance: user.wallet.balance,
          logo: env.get('APP_LOGO_URL'),
          appUrl: env.get('APP_URL'),
        })
    })
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(payment: any) {
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

      // Check email preferences if customer is loaded
      if (payment.customer && !this.shouldSendEmail(payment.customer)) return

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
          booking: {
            ...booking,
            selected_tickets: JSON.parse(booking.selected_tickets as unknown as string),
          },
          user: booking.user,
          event: booking.event,
          bookingUrl: `${env.get('APP_URL')}/bookings/${booking.id}`,
          logo: env.get('APP_LOGO_URL'),
          title: 'Booking Confirmation',
        })
    })
  }

  /**
   * Send ticket email
   */
  async sendTicket(booking: Booking) {
    const attendee =
      typeof booking.attendee_details === 'string'
        ? JSON.parse(booking.attendee_details)
        : booking.attendee_details

    console.log('Sending ticket to:', attendee.email, attendee)

    await this.mailer.send((message) => {
      message
        .subject(`Ticket for ${booking.event.title}`)
        .to(attendee.email)
        .from(this.from.address!, this.from.name)
        .htmlView('mails/ticket', {
          booking: {
            ...booking,
            attendee_details: attendee,
            selected_tickets: JSON.parse(booking.selected_tickets as unknown as string),
          },
          event: booking.event,
          attendee,
        })
    })
  }

  /**
   * Send refund notification
   */
  async sendRefundNotification(payment: any) {
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

  /**
   * Send low ticket inventory alert to organizer
   */
  async sendLowTicketInventoryAlert(event: Event, ticketType: string, remainingCount: number) {
    await event.load('user')

    await this.mailer.send((message) => {
      message
        .subject(`Low Ticket Inventory Alert - ${event.title}`)
        .to(event.user.email)
        .from(this.from.address!, this.from.name)
        .htmlView('mails/low_ticket_inventory', {
          event,
          organizer: event.user,
          ticketType,
          remainingCount,
          manageUrl: `${env.get('APP_URL')}/organizer/events/${event.id}/tickets`,
          logo: env.get('APP_LOGO_URL'),
          title: 'Low Ticket Inventory Alert',
        })
    })
  }

  async sendVendorRegistrationConfirmation(vendor: User, vendorService: EventVendor) {
    await vendorService.load('event')

    await this.mailer.send((message) => {
      message
        .subject(`Vendor Registration Confirmation - ${vendorService.event.title}`)
        .to(vendor.email)
        .from(this.from.address!, this.from.name)
        .htmlView('mails/vendor_registration_confirmation', {
          vendor,
          vendorService,
          logo: env.get('APP_LOGO_URL'),
          appUrl: env.get('APP_URL'),
          title: 'Vendor Registration Confirmation',
        })
    })
  }

  /**
   * Send e-ticket email
   */
  async sendETicket(data: {
    customer: { email: string; first_name?: string; last_name?: string }
    event: any
    tickets: any[]
    reference: string
    qrCodeUrl: string
  }) {
    await this.mailer.send((message) => {
      message
        .subject(`Your E-Ticket for ${data.event.title}`)
        .to(data.customer.email)
        .from(this.from.address!, this.from.name)
        .htmlView('mails/e_ticket', {
          ...data,
          appUrl: env.get('APP_URL'),
          logo: env.get('APP_LOGO_URL'),
        })
    })
  }

  /**
   * Send vendor pass email
   */
  async sendVendorPass(data: {
    vendor: User
    vendorService: EventVendor
    event: Event
    reference: string
    qrCodeUrl: string
  }) {
    await this.mailer
      .send((message) => {
        message
          .subject(`Your Vendor Pass for ${data.event.title}`)
          .to(data.vendor.email)
          .from(this.from.address!, this.from.name)
          .htmlView('mails/vendor_pass', {
            ...data,
            appUrl: env.get('APP_URL'),
            logo: env.get('APP_LOGO_URL'),
          })
      })
      .then((response) => {
        console.log('Vendor pass email sent successfully', response)
      })
      .catch((error) => {
        console.error('Failed to send vendor pass email:', error)
      })
  }

  async sendWaitlistSignupEmail(payload: { business_name: string; email: string; role: string }) {
    await this.mailer
      .send((message) => {
        message
          .to(env.get('MAIL_FROM_ADDRESS')!)
          .from(this.from.address!, this.from.name)
          .subject('Waitlist Signup')
          .htmlView('mails/waitlist_signup', {
            business_name: payload.business_name,
            email: payload.email,
            role: payload.role,
            timestamp: new Date().toISOString(),
            logo: env.get('APP_LOGO_URL'),
            appUrl: env.get('APP_URL'),
          })
      })
      .then((response) => {
        console.log('Waitlist signup email sent successfully', response)
      })
      .catch((error) => {
        console.error('Failed to send waitlist signup email:', error)
      })
  }

  async sendNewWaitlistSignupToAdminEmail(entry: Waitlist) {
    await this.mailer
      .send((message) => {
        message
          .to(env.get('ADMIN_EMAIL')!)
          .from(this.from.address!, this.from.name)
          .subject('New Waitlist Signup')
          .htmlView('mails/new_waitlist_signup_to_admin', {
            business_name: entry.business_name,
            email: entry.email,
            role: entry.role,
            timestamp: entry.created_at.toISO(),
            logo: env.get('APP_LOGO_URL'),
            appUrl: env.get('APP_URL'),
          })
      })
      .then((response) => {
        console.log('New waitlist signup email sent successfully', response)
      })
      .catch((error) => {
        console.error('Failed to send new waitlist signup email:', error)
      })
  }
}
