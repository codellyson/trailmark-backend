import { DateTime } from 'luxon'
import {
  BaseModel,
  belongsTo,
  column,
  hasMany,
  SnakeCaseNamingStrategy,
  beforeSave,
  computed,
} from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import WalletTransaction from './wallet_transaction.js'
import { TransactionClientContract } from '@adonisjs/lucid/types/database'
import hash from '@adonisjs/core/services/hash'

BaseModel.namingStrategy = new SnakeCaseNamingStrategy()

export default class Wallet extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare user_id: number

  @column()
  declare balance: number

  @column()
  declare escrow_balance: number

  @column()
  declare pending_balance: number

  @column()
  declare currency: string

  @column()
  declare status: 'active' | 'frozen' | 'suspended'

  @column()
  declare is_verified: boolean

  @column.dateTime()
  declare verified_at: DateTime | null

  @column()
  declare daily_limit: number | null

  @column()
  declare monthly_limit: number | null

  @column()
  declare transaction_limit: number | null

  @column()
  declare withdrawal_settings: any

  @column()
  declare notification_settings: any

  @column()
  declare total_credited: number

  @column()
  declare total_debited: number

  @column()
  declare total_transactions: number

  @column.dateTime()
  declare last_transaction_at: DateTime | null

  @column({ serializeAs: null })
  declare pin_hash: string | null

  @column()
  declare failed_attempts: number

  @column.dateTime()
  declare locked_until: DateTime | null

  @column()
  declare security_settings: any

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  @belongsTo(() => User, {
    foreignKey: 'user_id',
  })
  declare user: BelongsTo<typeof User>

  @hasMany(() => WalletTransaction, {
    foreignKey: 'wallet_id',
  })
  declare transactions: HasMany<typeof WalletTransaction>

  @computed()
  get total_balance() {
    return this.balance + this.escrow_balance + this.pending_balance
  }

  @computed()
  get is_locked() {
    if (!this.locked_until) return false
    return DateTime.now() < this.locked_until
  }

  @beforeSave()
  public static async hashPin(wallet: Wallet) {
    if (wallet.$dirty.pin_hash) {
      wallet.pin_hash = await hash.make(wallet.pin_hash)
    }
  }

  public async verifyPin(pin: string): Promise<boolean> {
    if (!this.pin_hash) return false
    return await hash.verify(this.pin_hash, pin)
  }

  public async isTransactionAllowed(
    amount: number
  ): Promise<{ allowed: boolean; reason?: string }> {
    if (this.status !== 'active') {
      return { allowed: false, reason: 'Wallet is not active' }
    }

    if (this.is_locked) {
      return { allowed: false, reason: 'Wallet is locked' }
    }

    if (amount > this.balance) {
      return { allowed: false, reason: 'Insufficient balance' }
    }

    if (this.transaction_limit && amount > this.transaction_limit) {
      return { allowed: false, reason: 'Amount exceeds transaction limit' }
    }

    return { allowed: true }
  }

  public async incrementFailedAttempts(): Promise<void> {
    this.failed_attempts += 1
    if (this.failed_attempts >= 3) {
      this.locked_until = DateTime.now().plus({ minutes: 30 })
    }
    await this.save()
  }

  public async resetFailedAttempts(): Promise<void> {
    this.failed_attempts = 0
    this.locked_until = null
    await this.save()
  }

  static async setupWallet(user_id: number) {
    const wallet = await Wallet.create({
      user_id: user_id,
      balance: 0,
      escrow_balance: 0,
      pending_balance: 0,
      currency: 'NGN',
      status: 'active',
      is_verified: false,
      total_credited: 0,
      total_debited: 0,
      total_transactions: 0,
      failed_attempts: 0,
    })

    return wallet
  }

  async addTransaction(data: Partial<WalletTransaction>, client?: TransactionClientContract) {
    const transaction = await WalletTransaction.create({
      ...data,
      wallet_id: this.id,
      balance_before: this.balance,
      balance_after: this.balance + (data.amount || 0),
    })

    if (client) {
      await client.commit()
    }

    if (transaction.status === 'completed') {
      switch (transaction.type) {
        case 'credit':
          this.balance += transaction.amount
          this.total_credited += transaction.amount
          break

        case 'debit':
          this.balance -= transaction.amount
          this.total_debited += transaction.amount
          break

        case 'escrow':
          this.escrow_balance += transaction.amount
          this.balance -= transaction.amount
          break

        case 'refund':
          this.balance += transaction.amount
          this.total_credited += transaction.amount
          break

        case 'reversal':
          if (transaction.metadata?.original_type === 'credit') {
            this.balance -= transaction.amount
            this.total_credited -= transaction.amount
          } else {
            this.balance += transaction.amount
            this.total_debited -= transaction.amount
          }
          break
      }

      this.total_transactions += 1
      this.last_transaction_at = DateTime.now()
      await this.save()
    } else if (transaction.status === 'pending') {
      this.pending_balance += transaction.amount
      await this.save()
    }

    return transaction
  }

  hasSufficientBalance(amount: number): boolean {
    return this.balance >= amount
  }

  async getPendingTransactions() {
    return await WalletTransaction.query()
      .where('wallet_id', this.id)
      .where('status', 'pending')
      .orderBy('created_at', 'desc')
  }
}
