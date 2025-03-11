import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, SnakeCaseNamingStrategy } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Wallet from './wallet.js'

BaseModel.namingStrategy = new SnakeCaseNamingStrategy()

export default class WalletTransaction extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare wallet_id: number

  @column()
  declare amount: number

  @column()
  declare type: 'credit' | 'debit'

  @column()
  declare reference: string

  @column()
  declare description: string

  @column()
  declare status: 'pending' | 'completed' | 'failed'

  @column()
  declare payment_method: string

  @column()
  declare metadata: any

  @column()
  declare balance_before: number

  @column()
  declare balance_after: number

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  @belongsTo(() => Wallet, {
    foreignKey: 'wallet_id',
    localKey: 'id',
  })
  declare wallet: BelongsTo<typeof Wallet>

  static async findByReference(reference: string) {
    return await this.query().where('reference', reference).first()
  }
}
