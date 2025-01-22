import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, SnakeCaseNamingStrategy } from '@adonisjs/lucid/orm'
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
  first_name: string
  last_name: string
  email: string
  phone_number: string
  additional_info?: Record<string, any>
}

BaseModel.namingStrategy = new SnakeCaseNamingStrategy()
export default class Booking extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare user_id: number

  @column()
  declare event_id: number

  @column()
  declare booking_reference: string

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
  declare total_amount: number

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
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  @column.dateTime()
  declare cancelled_at: DateTime | null

  // Relationships
  @belongsTo(() => User, {
    foreignKey: 'user_id',
  })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Event, {
    foreignKey: 'event_id',
  })
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
    this.cancelled_at = DateTime.now()
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
