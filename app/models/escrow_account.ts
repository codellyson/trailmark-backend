import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Event from './event.js'

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
  declare status: 'held' | 'released' | 'cancelled' | 'refunded'

  @column.dateTime()
  declare held_at: DateTime

  @column.dateTime()
  declare release_date: DateTime | null

  @column.dateTime()
  declare released_at: DateTime | null

  @column({
    prepare: (value: any) => JSON.stringify(value),
    consume: (value: any) => JSON.parse(value),
  })
  declare metadata: Record<string, any>

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>

  @belongsTo(() => User, {
    foreignKey: 'photographer_id',
  })
  declare photographer: BelongsTo<typeof User>
}
