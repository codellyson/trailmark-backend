import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Event from './event.js'

export default class Organizer extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare user_id: number

  // Organization Info
  @column()
  declare organization_name: string | null

  @column()
  declare organization_description: string | null

  @column()
  declare website: string | null

  @column()
  declare organization_email: string | null

  @column()
  declare organization_phone: string | null

  // Address
  @column()
  declare addressLine1: string | null

  @column()
  declare addressLine2: string | null

  @column()
  declare city: string | null

  @column()
  declare state: string | null

  @column()
  declare postal_code: string | null

  @column()
  declare country: string | null

  // Legal & Verification
  @column()
  declare tax_id: string | null

  @column()
  declare registration_number: string | null

  @column()
  declare is_verified: boolean

  @column.dateTime()
  declare verified_at: DateTime | null

  @column()
  declare verification_documents: any

  // Settings & Preferences
  @column()
  declare event_categories: any

  @column()
  declare payment_details: any

  @column()
  declare commission_settings: any

  @column()
  declare organizer_permissions: any

  // Metrics
  @column()
  declare total_events: number

  @column()
  declare active_events: number

  @column()
  declare total_revenue: number

  @column()
  declare total_attendees: number

  // Timestamps
  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  // Relationships
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasMany(() => Event)
  declare events: HasMany<typeof Event>
}
