import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Event from './event.js'

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'refunded'

export type SelectedTicket = {
  ticket_id: string
  ticket_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

export type SelectedAddon = {
  addon_id: string
  addon_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

export type PaymentDetails = {
  provider?: string
  transaction_id?: string
  payment_method?: string
  payment_date?: string
  metadata?: Record<string, any>
}

export type AttendeeDetails = {
  full_name: string
  email: string
  phone?: string
  additional_info?: Record<string, any>
}

export default class Booking extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare eventId: number

  @column()
  declare bookingReference: string

  @column()
  declare status: BookingStatus

  @column({
    prepare: (value: SelectedTicket[]) => JSON.stringify(value),
    consume: (value: string) => JSON.parse(value),
  })
  declare selected_tickets: SelectedTicket[]

  @column({
    prepare: (value: SelectedAddon[]) => JSON.stringify(value),
    consume: (value: string) => JSON.parse(value),
  })
  declare selected_addons: SelectedAddon[]

  @column()
  declare totalAmount: number

  @column()
  declare currency: string

  @column()
  declare payment_status: string

  @column()
  declare payment_reference: string | null

  @column({ prepare: (value) => JSON.stringify(value), consume: (value) => JSON.parse(value) })
  declare payment_details: PaymentDetails

  @column({
    prepare: (value: AttendeeDetails) => JSON.stringify(value),
    consume: (value: string) => JSON.parse(value),
  })
  declare attendee_details: AttendeeDetails

  @column()
  declare waiver_accepted: boolean

  @column.dateTime()
  declare waiver_accepted_at: DateTime | null

  @column()
  declare checked_in: boolean

  @column.dateTime()
  declare checked_in_at: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare cancelledAt: DateTime | null

  // Relationships
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>

  // Helper methods
  public isRefundable(): boolean {
    return ['confirmed', 'completed'].includes(this.status)
  }

  public canCheckIn(): boolean {
    return this.status === 'confirmed' && !this.checked_in
  }

  public async cancel(): Promise<void> {
    this.status = 'cancelled'
    this.cancelledAt = DateTime.now()
    await this.save()
  }

  public async markAsCheckedIn(): Promise<void> {
    if (!this.canCheckIn()) {
      throw new Error('Booking cannot be checked in')
    }
    this.checked_in = true
    this.checked_in_at = DateTime.now()
    await this.save()
  }

  public async confirmPayment(paymentDetails: PaymentDetails): Promise<void> {
    this.payment_status = 'paid'
    this.payment_details = paymentDetails
    this.status = 'confirmed'
    await this.save()
  }
}
