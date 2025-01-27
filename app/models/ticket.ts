import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, computed } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Event from './event.js'
import Booking from './booking.js'

export type TicketType = 'general' | 'vip' | 'early_bird'
export type TicketStatus = 'draft' | 'active' | 'sold_out' | 'expired'

export default class Ticket extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare event_id: number

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare type: TicketType

  @column()
  declare price: number

  @column()
  declare currency: string

  @column()
  declare currency_symbol: string

  @column()
  declare capacity: number | null

  @column()
  declare sold_count: number

  @column()
  declare reserved_count: number

  @column()
  declare status: TicketStatus

  @column.dateTime()
  declare sales_start_date: DateTime | null

  @column.dateTime()
  declare sales_end_date: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relationships
  @belongsTo(() => Event, {
    foreignKey: 'event_id',
  })
  declare event: BelongsTo<typeof Event>

  @hasMany(() => Booking)
  declare bookings: HasMany<typeof Booking>

  @column()
  declare quantity: number

  // Computed Properties
  @computed()
  get availableCount() {
    if (!this.capacity) return null // unlimited capacity
    return this.capacity - (this.sold_count + this.reserved_count)
  }

  @computed()
  get isAvailable() {
    if (this.status !== 'active') return false
    if (!this.sales_start_date || !this.sales_end_date) return true

    const now = DateTime.now()
    return (
      now >= this.sales_start_date &&
      now <= this.sales_end_date &&
      (this.availableCount === null || this.availableCount > 0)
    )
  }

  @computed()
  get formattedPrice() {
    const price = typeof this.price === 'string' ? Number.parseInt(this.price) : this.price
    return `${this.currency_symbol}${price.toFixed(2)}`
  }

  // Helper Methods
  public async checkAvailability(quantity: number): Promise<boolean> {
    if (!this.isAvailable) return false
    if (this.availableCount === null) return true
    return this.availableCount >= quantity
  }

  public async reserve(quantity: number): Promise<boolean> {
    if (!(await this.checkAvailability(quantity))) {
      throw new Error('Insufficient ticket quantity available')
    }

    this.reserved_count += quantity
    if (this.capacity && this.reserved_count + this.sold_count >= this.capacity) {
      this.status = 'sold_out'
    }

    await this.save()
    return true
  }

  public async confirmSale(quantity: number): Promise<boolean> {
    if (this.reserved_count < quantity) {
      throw new Error('Not enough tickets reserved')
    }

    this.reserved_count -= quantity
    this.sold_count += quantity

    if (this.capacity && this.sold_count >= this.capacity) {
      this.status = 'sold_out'
    }

    await this.save()
    return true
  }

  public async cancelReservation(quantity: number): Promise<void> {
    if (this.reserved_count < quantity) {
      throw new Error('Cannot cancel more tickets than reserved')
    }

    this.reserved_count -= quantity
    if (this.status === 'sold_out' && this.availableCount! > 0) {
      this.status = 'active'
    }

    await this.save()
  }

  public async updateStatus(): Promise<void> {
    const now = DateTime.now()

    if (this.sales_end_date && now > this.sales_end_date) {
      this.status = 'expired'
    } else if (this.capacity && this.sold_count >= this.capacity) {
      this.status = 'sold_out'
    } else if (this.sales_start_date && now >= this.sales_start_date) {
      this.status = 'active'
    }

    await this.save()
  }
}
