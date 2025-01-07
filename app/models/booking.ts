import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import BookingAddOn from './booking_add_on.js'
import Event from './event.js'
import User from './user.js'

export default class Booking extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare eventId: string

  @column()
  declare userId: string

  @column()
  declare ticketNumber: string

  @column()
  declare totalAmount: number

  @column()
  declare photographyIncluded: boolean

  @column()
  declare waiverSigned: boolean

  @column()
  declare status: 'pending' | 'confirmed' | 'cancelled' | 'refunded'

  @column()
  declare total: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>

  @hasMany(() => BookingAddOn)
  declare addOns: HasMany<typeof BookingAddOn>
}
