import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  belongsTo,
  hasMany,
  beforeCreate,
  SnakeCaseNamingStrategy,
} from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Event from './event.js'
import Booking from './booking.js'
import TicketCustomQuestion from './custom_question.js'
import { v4 as uuidv4 } from 'uuid'

export type TicketStatus = 'valid' | 'used' | 'cancelled' | 'refunded' | 'transferred'
export type TicketType = 'general' | 'vip' | 'early_bird'

BaseModel.namingStrategy = new SnakeCaseNamingStrategy()

export default class Ticket extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare price: number

  @column()
  declare quantity: 'limited' | 'unlimited'

  @column()
  declare limit: number

  @column()
  declare quantity_sold: number

  @column()
  declare type: 'free' | 'paid' | 'invite-only'

  @column()
  declare description?: string

  @column({
    prepare: (value: string[]) => (Array.isArray(value) ? JSON.stringify(value) : value),
    consume: (value: string) => {
      if (!value) return []
      return typeof value === 'string' ? JSON.parse(value) : value
    },
  })
  declare perks: string[]

  @column()
  declare group_size?: number

  @column()
  declare event_id: number

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  @belongsTo(() => Event, {
    foreignKey: 'event_id',
  })
  declare event: BelongsTo<typeof Event>

  @hasMany(() => TicketCustomQuestion)
  declare custom_questions: HasMany<typeof TicketCustomQuestion>
}
