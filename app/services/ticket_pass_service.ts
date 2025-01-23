import { PKPass } from 'passkit-generator'
import { DateTime } from 'luxon'
import type Event from '#models/event'
import type Booking from '#models/booking'
import { GoogleAuth } from 'google-auth-library'
import jwt from 'jsonwebtoken'
import env from '#start/env'
import fs from 'node:fs'

export default class TicketPassService {
  /**
   * Generate Apple Wallet Pass (.pkpass)
   */
  async generateApplePass(booking: Booking, event: Event) {
    // const { wwdr, signerCert, signerKey, signerKeyPassphrase } = getCertificatesContentsSomehow()
    // const model = {
    //   // 'thumbnail.png': Buffer.from(['test']),
    //   // 'icon.png': Buffer.from(['test']),
    //   // 'pass.json': Buffer.from(['test']),
    //   // 'it.lproj/pass.strings': Buffer.from(['test']),
    // }
    // const pass = new PKPass(model, {
    //   wwdr,
    //   signerCert,
    //   signerKey,
    //   signerKeyPassphrase,
    // })
    // try {
    // } catch (error) {
    //   console.error('Error generating Apple Pass:', error)
    //   throw error
    // }
  }

  /**
   * Generate Google Pay Pass (JWT)
   */
  async generateGooglePass(booking: Booking, event: Event) {
    try {
      const auth = new GoogleAuth({
        scopes: 'https://www.googleapis.com/auth/cloud-platform',
      })

      const client = await auth.getClient()
      const projectId = await auth.getProjectId()
      const credential = await auth.getCredentials()
      const privateKey = ''

      const url = `https://dns.googleapis.com/dns/v1/projects/${projectId}`
      const res = await client.request({ url })
      console.log(res.data)

      const eventTicketClass = {
        id: `EVENT_CLASS_${event.id}`,
        issuerName: 'Trailmark Events',
        eventName: {
          defaultValue: {
            language: 'en-US',
            value: event.name,
          },
        },
        venue: {
          defaultValue: {
            language: 'en-US',
            value: event.location,
          },
        },
      }

      const eventTicketObject = {
        id: `TICKET_${booking.booking_reference}`,
        classId: `EVENT_CLASS_${event.id}`,
        state: 'ACTIVE',
        heroImage: {
          sourceUri: {
            uri: event.thumbnails[0],
          },
        },
        barcode: {
          type: 'QR_CODE',
          value: booking.booking_reference,
        },
        ticketHolderName: `${booking.user.first_name} ${booking.user.last_name}`,
        ticketNumber: booking.booking_reference,
      }

      const claims = {
        iss: credential.client_email,
        aud: 'google',
        origins: ['www.yourwebsite.com'],
        typ: 'savetowallet',
        payload: {
          eventTicketObjects: [eventTicketObject],
          eventTicketClasses: [eventTicketClass],
        },
      }

      const token = jwt.sign(claims, privateKey, { algorithm: 'RS256' })
      return token
    } catch (error) {
      console.error('Error generating Google Pass:', error)
      throw error
    }
  }
}
