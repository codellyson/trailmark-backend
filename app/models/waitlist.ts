import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Waitlist extends BaseModel {
  static table = 'waitlist'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare email: string

  @column()
  declare business_name: string

  @column()
  declare role: 'vendor' | 'organizer' | 'attendee'

  @column()
  declare is_contacted: boolean

  @column.dateTime()
  declare contacted_at: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime
}
