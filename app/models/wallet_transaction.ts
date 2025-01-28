import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Wallet from './wallet.js'
import Event from './event.js'
import User from './user.js'
import { SnakeCaseNamingStrategy } from '@adonisjs/lucid/orm'

BaseModel.namingStrategy = new SnakeCaseNamingStrategy()

export default class WalletTransaction extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare wallet_id: number

  @column()
  declare type: // Photographer transactions
  | 'event_payment_received' // When photographer receives payment from escrow
    | 'payout_request' // When photographer requests a payout
    | 'platform_fee' // Platform fee deduction

    // Organizer transactions
    | 'ticket_sale_revenue' // Revenue from ticket sales
    | 'photographer_fee' // Fee paid to photographer (moves to escrow)
    | 'refund_issued' // When refund is given to customer

    // Common transactions
    | 'withdrawal' // Money withdrawn to bank account
    | 'adjustment' // Manual adjustment by admin

  @column()
  declare amount: number

  @column()
  declare fee: number

  @column()
  declare balance_after: number

  @column()
  declare status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

  @column()
  declare currency: string

  @column()
  declare reference_type:
    | 'event' // Related to an event
    | 'event_payment' // Related to a ticket payment
    | 'escrow' // Related to escrow account
    | 'payout' // Related to payout request
    | 'adjustment' // Manual adjustment
    | null

  @column()
  declare reference_id: number | null

  @column()
  declare metadata: {
    event_id?: number
    photographer_id?: number
    customer_id?: number
    escrow_id?: number
    platform_fee?: number
    payout_method?: string
    reason?: string
    notes?: string
    initiated_by?: number
    [key: string]: any
  }

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  @column.dateTime()
  declare processed_at: DateTime | null

  @belongsTo(() => Wallet, {
    foreignKey: 'wallet_id',
  })
  declare wallet: BelongsTo<typeof Wallet>

  @belongsTo(() => Event, {
    foreignKey: 'reference_id',
    onQuery: (query) => {
      query.where('reference_type', 'event')
    },
  })
  declare event: BelongsTo<typeof Event>

  @belongsTo(() => User, {
    foreignKey: 'metadata.initiated_by',
  })
  declare initiated_by: BelongsTo<typeof User>

  /**
   * Get formatted amount with currency symbol
   */
  getFormattedAmount(): string {
    const symbol = this.wallet.currency_symbol || '$'
    return `${symbol}${Math.abs(this.amount).toFixed(2)}`
  }

  /**
   * Get transaction description based on type
   */
  getDescription(): string {
    switch (this.type) {
      case 'event_payment_received':
        return `Payment received for event #${this.metadata.event_id}`
      case 'ticket_sale_revenue':
        return `Ticket sale revenue for event #${this.metadata.event_id}`
      case 'photographer_fee':
        return `Photographer fee for event #${this.metadata.event_id}`
      case 'platform_fee':
        return 'Platform fee'
      case 'payout_request':
        return `Payout request via ${this.metadata.payout_method}`
      case 'withdrawal':
        return 'Withdrawal to bank account'
      case 'refund_issued':
        return `Refund issued for event #${this.metadata.event_id}`
      case 'adjustment':
        return this.metadata.reason || 'Manual adjustment'
      default:
        return 'Transaction'
    }
  }

  /**
   * Check if transaction is reversible
   */
  isReversible(): boolean {
    const reversibleTypes = ['event_payment_received', 'ticket_sale_revenue']
    return (
      reversibleTypes.includes(this.type) &&
      this.status === 'completed' &&
      DateTime.now().diff(this.created_at, 'days').days < 30
    )
  }

  /**
   * Check if transaction needs review
   */
  needsReview(): boolean {
    return (
      this.amount > 1000 || // Large transactions
      this.type === 'adjustment' || // Manual adjustments
      this.status === 'failed' // Failed transactions
    )
  }
}
