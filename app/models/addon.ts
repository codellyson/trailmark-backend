import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, computed } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Event from './event.js'
import User from './user.js'
import EscrowAccount from './escrow_account.js'

export type AddonType = 'photography' | 'equipment_rental' | 'transportation' | 'custom'
export type AddonStatus = 'active' | 'inactive' | 'sold_out'

export interface EquipmentDetails {
  brand?: string
  model?: string
  condition?: string
  specifications?: Record<string, any>
}

export interface TransportationDetails {
  vehicleType?: string
  capacity?: number
  pickupLocation?: string
  dropoffLocation?: string
  includes?: string[]
}

export default class Addon extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare event_id: number

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare type: AddonType

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
  declare status: AddonStatus

  // Photography specific fields
  @column()
  declare photo_count: number | null

  @column()
  declare photographer_id: number | null

  // Equipment specific fields
  @column({
    prepare: (value: EquipmentDetails) => JSON.stringify(value),
    consume: (value: string) => JSON.parse(value),
  })
  declare equipment_details: EquipmentDetails | null

  // Transportation specific fields
  @column({
    prepare: (value: TransportationDetails) => JSON.stringify(value),
    consume: (value: string) => JSON.parse(value),
  })
  declare transportation_details: TransportationDetails | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  // Relationships
  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>

  @belongsTo(() => EscrowAccount)
  declare escrow: BelongsTo<typeof EscrowAccount>

  @belongsTo(() => User, { foreignKey: 'photographerId' })
  declare photographer: BelongsTo<typeof User>

  // Computed Properties
  @computed()
  get availableCount() {
    if (!this.capacity) return null
    return this.capacity - (this.sold_count + this.reserved_count)
  }

  @computed()
  get isAvailable() {
    return this.status === 'active' && (this.availableCount === null || this.availableCount > 0)
  }

  @computed()
  get formatted_price() {
    // Convert price to number and handle potential null/undefined
    const numericPrice = Number(this.price) || 0
    return `${this.currency_symbol}${numericPrice.toFixed(2)}`
  }

  // Helper Methods
  public async checkAvailability(quantity: number): Promise<boolean> {
    if (!this.isAvailable) return false
    if (this.availableCount === null) return true
    return this.availableCount >= quantity
  }

  public async reserve(quantity: number): Promise<boolean> {
    if (!(await this.checkAvailability(quantity))) {
      throw new Error('Insufficient addon quantity available')
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
      throw new Error('Not enough addons reserved')
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
      throw new Error('Cannot cancel more addons than reserved')
    }

    this.reserved_count -= quantity
    if (this.status === 'sold_out' && this.availableCount! > 0) {
      this.status = 'active'
    }

    await this.save()
  }
}
