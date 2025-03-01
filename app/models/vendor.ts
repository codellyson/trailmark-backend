import {
  BaseModel,
  column,
  belongsTo,
  beforeCreate,
  SnakeCaseNamingStrategy,
  manyToMany,
} from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import { v4 as uuidv4 } from 'uuid'
import Event from './event.js'
import { DateTime } from 'luxon'

BaseModel.namingStrategy = new SnakeCaseNamingStrategy()

export default class Vendor extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare description?: string

  @column()
  declare category: string

  @column()
  declare contact_email: string

  @column()
  declare contact_phone?: string

  @column()
  declare booth_number?: string

  @column()
  declare status: 'pending' | 'approved' | 'rejected'

  @column()
  declare event_id: string

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>

  @manyToMany(() => Event, {
    pivotTable: 'vendors',
    pivotColumns: [
      'status',
      'notes',
      'services',
      'agreed_price',
      'booth_location',
      'setup_time',
      'teardown_time',
    ],
  })
  declare events: ManyToMany<typeof Event>
}
