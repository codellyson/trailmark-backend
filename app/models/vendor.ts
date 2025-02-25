import { BaseModel, belongsTo, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import User from './user.js'
import Event from './event.js'

export type VendorCategory =
  | 'photographer'
  | 'caterer'
  | 'decorator'
  | 'musician'
  | 'venue'
  | 'other'
export type VendorStatus = 'pending' | 'active' | 'suspended' | 'inactive'

export default class Vendor extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare user_id: number

  // Business Info
  @column()
  declare business_name: string

  @column()
  declare business_description: string | null

  @column()
  declare business_email: string

  @column()
  declare business_phone: string | null

  @column()
  declare website: string | null

  // Business Details
  @column()
  declare tax_id: string | null

  @column()
  declare registration_number: string | null

  @column()
  declare business_hours: any

  @column()
  declare service_areas: any

  @column()
  declare business_type:
    | 'food'
    | 'merchandise'
    | 'services'
    | 'entertainment'
    | 'equipment'
    | 'other'

  // Address
  @column()
  declare address_line_1: string | null

  @column()
  declare address_line_2: string | null

  @column()
  declare city: string | null

  @column()
  declare state: string | null

  @column()
  declare postal_code: string | null

  @column()
  declare country: string | null

  // Verification & Status
  @column()
  declare isVerified: boolean

  @column.dateTime()
  declare verified_at: DateTime | null

  @column()
  declare verification_documents: any

  // Business Settings
  @column()
  declare services_offered: any

  @column()
  declare products_offered: any

  @column()
  declare commissionRate: number | null

  @column()
  declare payment_details: any

  // Media & Display
  @column()
  declare logo_url: string | null

  @column()
  declare gallery: any

  @column()
  declare social_media_links: any

  @column()
  declare terms_and_conditions: string | null

  // Insurance & Compliance
  @column()
  declare has_insurance: boolean

  @column.date()
  declare insuranceExpiry: DateTime | null

  @column()
  declare certifications: any

  @column()
  declare compliance_documents: any

  // Metrics
  @column()
  declare total_events: number

  @column()
  declare total_revenue: number

  @column()
  declare rating_count: number

  @column()
  declare average_rating: number

  // Timestamps
  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare last_active_at: DateTime | null

  // Relationships
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @manyToMany(() => Event)
  declare events: ManyToMany<typeof Event>
}
