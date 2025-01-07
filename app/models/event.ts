import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Booking from './booking.js'
import User from './user.js'

export default class Event extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare organizer_id: number

  @column()
  declare status: 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled'

  @column()
  declare title: string

  @column()
  declare description: string

  @column()
  declare location: string

  @column.date()
  declare date: DateTime

  @column()
  declare start_time: string

  @column()
  declare end_time: string

  @column()
  declare sales_start_date: string

  @column()
  declare sales_deadline: string

  @column()
  declare ticket_options: Array<{
    ticket_name: string
    ticket_description: string
    ticket_capacity: number
    sales_start_date: string
    sales_deadline: string
    ticket_type: 'general' | 'early_bird' | 'vip'
    ticket_currency: string
    ticket_currency_symbol: string
    ticket_price: number
  }>

  @column()
  declare add_ons: {
    photography_addons: {
      enabled: boolean
      packages: Array<{
        price: number
        name: string
        description: string
        photo_count: number
        photographer_id: string
      }>
    }
    equipment_rentals: {
      enabled: boolean
      packages: Array<{
        price: number
        name: string
        description: string
      }>
    }
    transportation_services: {
      enabled: boolean
      packages: Array<{
        price: number
        name: string
        description: string
      }>
    }
    custom_addons: {
      enabled: boolean
      packages: Array<{
        price: number
        name: string
        description: string
      }>
    }
  }

  @column()
  declare waiver: {
    enabled: boolean
    content: string
  }

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'organizer_id' })
  declare organizer: BelongsTo<typeof User>

  @hasMany(() => Booking)
  declare bookings: HasMany<typeof Booking>
}
