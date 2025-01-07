import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Event from './event.js'
import User from './user.js'

export default class EventPhotographer extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare eventId: number

  @column()
  declare photographerId: number

  @column()
  declare pricePerPerson: number

  @column()
  declare status: 'pending' | 'confirmed' | 'rejected'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>

  @belongsTo(() => User, { foreignKey: 'photographerId' })
  declare photographer: BelongsTo<typeof User>
}
