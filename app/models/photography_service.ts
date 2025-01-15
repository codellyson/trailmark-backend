import {
  BaseModel,
  belongsTo,
  column,
  hasOne,
  hasMany,
  SnakeCaseNamingStrategy,
} from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import User from './user.js'
import Event from './event.js'
import EscrowAccount from './escrow_account.js'
import Photo from './photo.js'
import Addon from './addon.js'

export type PhotographyJobStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'in_progress'
  | 'completed'
  | 'delivered'
  | 'cancelled'

BaseModel.namingStrategy = new SnakeCaseNamingStrategy()
export default class PhotographyService extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare event_id: number

  @column()
  declare addon_id: number

  @column()
  declare photographer_id: number

  @column()
  declare status: PhotographyJobStatus

  @column()
  declare price: number

  @column()
  declare photo_count: number

  @column.dateTime()
  declare event_date: DateTime

  @column.dateTime()
  declare accepted_at: DateTime | null

  @column.dateTime()
  declare delivered_at: DateTime | null

  @column.dateTime()
  declare completed_at: DateTime | null

  @column.dateTime({
    autoCreate: true,
  })
  declare created_at: DateTime

  @column.dateTime({
    autoCreate: true,
    autoUpdate: true,
  })
  declare updated_at: DateTime

  // Relationships
  @belongsTo(() => Event, {
    foreignKey: 'event_id',
  })
  declare event: BelongsTo<typeof Event>

  @belongsTo(() => User, { foreignKey: 'photographer_id' })
  declare photographer: BelongsTo<typeof User>

  @hasOne(() => EscrowAccount)
  declare escrow: HasOne<typeof EscrowAccount>

  @belongsTo(() => Addon, {
    foreignKey: 'addon_id',
  })
  declare addon: BelongsTo<typeof Addon>

  @hasMany(() => Photo)
  declare photos: HasMany<typeof Photo>
}
