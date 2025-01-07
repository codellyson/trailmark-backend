import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class AdditionalInfo extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string

  @column()
  declare bio: string

  @column()
  declare website: string

  @column()
  declare instagram: string

  @column()
  declare facebook: string

  @column()
  declare twitter: string

  @column()
  declare youtube: string

  @column()
  declare linkedin: string

  @column()
  declare pinterest: string

  @column()
  declare snapchat: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
