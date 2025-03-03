import {
  BaseModel,
  column,
  belongsTo,
  beforeCreate,
  SnakeCaseNamingStrategy,
  manyToMany,
  hasMany,
} from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, HasOne, ManyToMany } from '@adonisjs/lucid/types/relations'
import Event from './event.js'
import { DateTime } from 'luxon'
import User from './user.js'
import VendorService from './vendor_service.js'

BaseModel.namingStrategy = new SnakeCaseNamingStrategy()

export default class EventVendor extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare status: 'pending' | 'approved' | 'rejected'

  @column()
  declare booth_number: string

  @column()
  declare agreed_price: number

  @column()
  declare booth_location: string

  @column()
  declare setup_time: DateTime

  @column()
  declare teardown_time: DateTime

  @column()
  declare event_id: string

  // Vendor ID is the user_id of the vendor
  @column()
  declare vendor_id: string

  // Vendor Service IDs
  @column()
  declare service_id: string

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>

  @belongsTo(() => User, {
    foreignKey: 'user_id',
  })
  declare vendor: BelongsTo<typeof User>

  @hasMany(() => VendorService, {
    foreignKey: 'user_id',
  })
  declare services: HasMany<typeof VendorService>
}
