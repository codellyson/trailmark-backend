import { DateTime } from 'luxon'
import {
  BaseModel,
  belongsTo,
  column,
  hasMany,
  beforeCreate,
  beforeUpdate,
} from '@adonisjs/lucid/orm'
import Event from './event.js'
import { SnakeCaseNamingStrategy } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import TicketSale from './ticket_sale.js'

export enum TicketType {
  FREE = 'free',
  PAID = 'paid',
  INVITE_ONLY = 'invite-only',
}

export enum TicketStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  SOLD_OUT = 'sold_out',
  EXPIRED = 'expired',
}

BaseModel.namingStrategy = new SnakeCaseNamingStrategy()
export default class Ticket extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare event_id: number

  @column()
  declare name: string

  @column()
  declare price: number

  @column()
  declare quantity_available: number

  @column()
  declare quantity_sold: number

  @column()
  declare is_unlimited: boolean

  @column()
  declare type: TicketType

  @column()
  declare status: TicketStatus

  @column()
  declare description?: string

  @column({
    prepare: (value: any) => {
      // If it's already a string, try to parse it
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value)
          // If it's a nested array, flatten it
          if (Array.isArray(parsed) && Array.isArray(parsed[0])) {
            return JSON.stringify(parsed.flat())
          }
          return value
        } catch {
          return JSON.stringify([value])
        }
      }

      // If it's an array, check for nested arrays
      if (Array.isArray(value)) {
        // Flatten nested arrays
        if (Array.isArray(value[0])) {
          return JSON.stringify(value.flat())
        }
        return JSON.stringify(value)
      }

      // Default case: empty array
      return JSON.stringify([])
    },
    consume: (value: string) => {
      try {
        const parsed = JSON.parse(value)
        // If it's a nested array, flatten it
        if (Array.isArray(parsed) && Array.isArray(parsed[0])) {
          return parsed.flat()
        }
        return parsed
      } catch {
        return value
      }
    },
  })
  declare perks: string[]

  @column()
  declare group_size: number

  @column()
  declare min_per_order?: number

  @column()
  declare max_per_order?: number

  @column.dateTime()
  declare sale_starts_at?: DateTime

  @column.dateTime()
  declare sale_ends_at?: DateTime

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  // Relationships
  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>

  @hasMany(() => TicketSale)
  declare sales: HasMany<typeof TicketSale>

  // Hooks
  @beforeCreate()
  @beforeUpdate()
  public static async validateTicket(ticket: Ticket) {
    // Ensure quantity sold doesn't exceed available
    if (!ticket.is_unlimited && ticket.quantity_sold > ticket.quantity_available) {
      throw new Error('Quantity sold cannot exceed available quantity')
    }

    // Validate min/max order values
    if (
      ticket.min_per_order &&
      ticket.max_per_order &&
      ticket.min_per_order > ticket.max_per_order
    ) {
      throw new Error('Minimum order quantity cannot be greater than maximum')
    }
  }

  // Methods
  public async isAvailable(): Promise<boolean> {
    if (this.status !== TicketStatus.ACTIVE) return false
    if (this.is_unlimited) return true

    const now = DateTime.now()
    const hasStarted = !this.sale_starts_at || now >= this.sale_starts_at
    const hasNotEnded = !this.sale_ends_at || now <= this.sale_ends_at
    const hasStock = this.quantity_available > this.quantity_sold

    return hasStarted && hasNotEnded && hasStock
  }

  public async validatePurchaseQuantity(quantity: number): Promise<boolean> {
    if (quantity < (this.min_per_order || 1)) {
      throw new Error(`Minimum purchase quantity is ${this.min_per_order || 1}`)
    }

    if (this.max_per_order && quantity > this.max_per_order) {
      throw new Error(`Maximum purchase quantity is ${this.max_per_order}`)
    }

    if (!this.is_unlimited && quantity > this.quantity_available - this.quantity_sold) {
      throw new Error('Insufficient tickets available')
    }

    return true
  }

  public calculateTotalPrice(quantity: number): number {
    return this.price * quantity
  }

  public calculatePlatformFee(amount: number): number {
    const PLATFORM_FEE = 0.05 // 5%
    return amount * PLATFORM_FEE
  }
}
