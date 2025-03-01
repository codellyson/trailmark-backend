import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, beforeCreate } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Event from './event.js'
import Booking from './booking.js'
import { v4 as uuidv4 } from 'uuid'

export type TicketStatus = 'valid' | 'used' | 'cancelled' | 'refunded' | 'transferred'
export type TicketType = 'general' | 'vip' | 'early_bird'

export default class Ticket extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare price: number

  @column()
  declare capacity: number

  @column()
  declare type: 'general' | 'vip' | 'early_bird' | 'group'

  @column()
  declare description?: string

  @column()
  declare perks: string[]

  @column()
  declare group_size?: number

  @column()
  declare tickets_sold: number

  @column()
  declare event_id: string

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>

  @beforeCreate()
  static async createUUID(ticket: Ticket) {
    ticket.id = uuidv4()
  }
}
