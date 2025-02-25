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
  declare reference: string

  @column()
  declare type: 'credit' | 'debit' | 'refund' | 'reversal' | 'escrow'

  @column()
  declare amount: number

  @column()
  declare currency: string

  @column()
  declare balance_before: number

  @column()
  declare balance_after: number

  @column()
  declare description: string

  @column()
  declare status: 'pending' | 'completed' | 'failed' | 'reversed'

  @column()
  declare payment_method: string | null

  @column()
  declare payment_reference: string | null

  @column()
  declare metadata: any

  @column()
  declare source_type: string | null

  @column()
  declare source_id: number | null

  @column()
  declare destination_type: string | null

  @column()
  declare destination_id: number | null

  @column()
  declare processor: string | null

  @column()
  declare processor_reference: string | null

  @column()
  declare processor_response: any

  @column()
  declare failure_reason: string | null

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  @column.dateTime()
  declare processed_at: DateTime | null

  @belongsTo(() => Wallet)
  declare wallet: BelongsTo<typeof Wallet>

  @belongsTo(() => Event, {
    foreignKey: 'source_id',
    onQuery: (query) => {
      query.where('source_type', 'event')
    },
  })
  declare event: BelongsTo<typeof Event>

  @belongsTo(() => User, {
    foreignKey: 'destination_id',
    onQuery: (query) => {
      query.where('destination_type', 'user')
    },
  })
  declare user: BelongsTo<typeof User>

  public isSuccess(): boolean {
    return this.status === 'completed'
  }

  public isReversible(): boolean {
    return (
      this.status === 'completed' &&
      this.type !== 'reversal' &&
      DateTime.now() <= this.created_at.plus({ days: 30 })
    )
  }

  public async reverse(reason: string): Promise<WalletTransaction | null> {
    if (!this.isReversible()) return null

    return await WalletTransaction.create({
      wallet_id: this.wallet_id,
      type: 'reversal',
      amount: this.amount,
      currency: this.currency,
      description: `Reversal for transaction ${this.reference}: ${reason}`,
      status: 'completed',
      metadata: {
        original_transaction: this.reference,
        reversal_reason: reason,
      },
    })
  }

  public getFormattedAmount(): string {
    const symbol = this.currency === 'NGN' ? '₦' : '$'
    return `${symbol}${Math.abs(this.amount).toFixed(2)}`
  }

  public getDescription(): string {
    const eventId = this.metadata?.event_id
    const reason = this.metadata?.reason

    switch (this.type) {
      case 'credit':
        return eventId
          ? `Credit for event #${eventId}`
          : 'Wallet credit'
      case 'debit':
        return eventId
          ? `Debit for event #${eventId}`
          : 'Wallet debit'
      case 'refund':
        return eventId
          ? `Refund for event #${eventId}`
          : 'Refund processed'
      case 'reversal':
        return reason
          ? `Reversal: ${reason}`
          : 'Transaction reversal'
      case 'escrow':
        return eventId
          ? `Escrow for event #${eventId}`
          : 'Escrow transaction'
      default:
        return this.description || 'Transaction'
    }
  }

  public needsReview(): boolean {
    return (
      this.amount > 1000000 || // Large transactions (>1M)
      this.type === 'reversal' || // All reversals
      this.status === 'failed' // Failed transactions
    )
  }
}
