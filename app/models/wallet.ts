import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import WalletTransaction from './wallet_transaction.js'

export default class Wallet extends BaseModel {
  @column({ isPrimary: true })
  declare id: number
  @column()
  declare user_id: number

  @column()
  declare available_balance: number

  @column()
  declare pending_balance: number

  @column()
  declare total_earnings: number

  @column()
  declare currency: string

  @column()
  declare currency_symbol: string

  @column()
  declare payment_methods: {
    type: string
    details: Record<string, any>
    is_default: boolean
  }[]

  @column()
  declare payout_settings: {
    method: string
    account_details: Record<string, any>
    minimum_payout: number
    auto_payout_enabled: boolean
  }

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasMany(() => WalletTransaction)
  declare transactions: HasMany<typeof WalletTransaction>

  /**
   * Add a transaction and update balances
   */
  async addTransaction(data: Partial<WalletTransaction>) {
    const transaction = await WalletTransaction.create({
      ...data,
      wallet_id: this.id,
      balance_after: this.available_balance + (data.amount || 0),
    })

    // Update wallet balance based on transaction type and status
    if (transaction.status === 'completed') {
      switch (transaction.type) {
        case 'event_payment_received':
          // When photographer receives payment from escrow
          this.available_balance += transaction.amount
          this.total_earnings += transaction.amount
          break

        case 'ticket_sale_revenue':
          // When organizer receives ticket sale revenue
          this.available_balance += transaction.amount
          this.total_earnings += transaction.amount
          break

        case 'withdrawal':
          // When user withdraws money
          this.available_balance -= transaction.amount
          break

        case 'platform_fee':
          // When platform fee is deducted
          this.available_balance -= transaction.amount
          break
      }

      await this.save()
    } else if (transaction.status === 'pending') {
      // For pending transactions, update pendingBalance
      this.pending_balance += transaction.amount
      await this.save()
    }

    return transaction
  }

  /**
   * Check if wallet has sufficient balance
   */
  hasSufficientBalance(amount: number): boolean {
    return this.available_balance >= amount
  }

  /**
   * Get pending transactions
   */
  async getPendingTransactions() {
    return await WalletTransaction.query()
      .where('wallet_id', this.id)
      .where('status', 'pending')
      .orderBy('created_at', 'desc')
  }
}
