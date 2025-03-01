import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import User from './user.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class VendorService extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare name: string

  @column()
  declare price: number

  @column()
  declare description: string

  @column()
  declare category: string

  @column()
  declare status: string

  @column()
  declare image: string

  @column()
  declare user_id: number

  @belongsTo(() => User, {
    foreignKey: 'user_id',
  })
  declare vendor: BelongsTo<typeof User>
}
