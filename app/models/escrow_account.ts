import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, SnakeCaseNamingStrategy } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Event from './event.js'

BaseModel.namingStrategy = new SnakeCaseNamingStrategy()
export enum EscrowAccountStatus {
  HELD = 'held',
  RELEASED = 'released',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}
export default class EscrowAccount extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare event_id: number

  @column()
  declare photographer_id: number

  @column()
  declare amount: number

  @column()
  declare currency: string

  @column()
  declare status: EscrowAccountStatus

  @column.dateTime()
  declare held_at: DateTime

  @column.dateTime()
  declare release_date: DateTime | null

  @column.dateTime()
  declare released_at: DateTime | null

  @column({
    prepare: (value: Record<string, any>) => {
      return typeof value === 'string' ? value : JSON.stringify(value)
    },
    consume: (value: string) => {
      try {
        return typeof value === 'string' ? JSON.parse(value) : value
      } catch (error) {
        return {}
      }
    },
  })
  declare metadata: {
    addon_id?: number
    accepted_at?: string
    completed_at?: string
    message?: string
    photo_count?: number
    [key: string]: any
  }

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  @belongsTo(() => Event, {
    foreignKey: 'event_id',
  })
  declare event: BelongsTo<typeof Event>

  @belongsTo(() => User, {
    foreignKey: 'photographer_id',
  })
  declare photographer: BelongsTo<typeof User>
}
