import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Booking from './booking.js'

export default class Payment extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare bookingId: string

  @column()
  declare stripePaymentIntentId: string

  @column()
  declare amount: number

  @column()
  declare status: 'pending' | 'succeeded' | 'failed' | 'refunded'

  @column()
  declare stripeResponse: Record<string, any>

  @column.dateTime()
  declare paidAt: DateTime | null

  @column.dateTime()
  declare refundedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Booking)
  declare booking: BelongsTo<typeof Booking>
} 