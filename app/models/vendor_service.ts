import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import User from './user.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Event from './event.js'
import { SnakeCaseNamingStrategy } from '@adonisjs/lucid/orm'
BaseModel.namingStrategy = new SnakeCaseNamingStrategy()
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
  declare price_type: string

  @column()
  declare description: string

  @column()
  declare category: string

  @column()
  declare status: string

  @column({
    prepare: (value: string[]) => (Array.isArray(value) ? JSON.stringify(value) : value),
    consume: (value: string) => {
      if (!value) return []
      return typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))
        ? JSON.parse(value)
        : [value]
    },
  })
  declare images: string[]

  @column({
    prepare: (value: string[]) => (Array.isArray(value) ? JSON.stringify(value) : value),
    consume: (value: string) => {
      if (!value) return []
      return typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))
        ? JSON.parse(value)
        : [value]
    },
  })
  declare features: string[]

  @column()
  declare user_id: number

  @belongsTo(() => User, {
    foreignKey: 'user_id',
  })
  declare vendor: BelongsTo<typeof User>
}
