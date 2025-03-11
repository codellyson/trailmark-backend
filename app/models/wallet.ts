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
  declare balance: number

  @column()
  declare currency: string

  @column()
  declare status: 'active' | 'frozen' | 'suspended'

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasMany(() => WalletTransaction, {
    foreignKey: 'wallet_id',
  })
  declare transactions: HasMany<typeof WalletTransaction>

  static async setupWallet(user_id: number) {
    return await Wallet.create({
      user_id,
      balance: 0,
      currency: 'NGN',
      status: 'active',
    })
  }
}
