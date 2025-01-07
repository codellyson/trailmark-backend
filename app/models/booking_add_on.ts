import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Booking from './booking.js'
import EventAddOn from './event_add_on.js'

export default class BookingAddOn extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare bookingId: string

  @column()
  declare addOnId: string

  @column()
  declare quantity: number

  @column()
  declare priceAtTime: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => Booking)
  declare booking: BelongsTo<typeof Booking>

  @belongsTo(() => EventAddOn)
  declare addOn: BelongsTo<typeof EventAddOn>
}
