import {
  BaseModel,
  beforeCreate,
  belongsTo,
  column,
  hasMany,
  manyToMany,
  SnakeCaseNamingStrategy,
} from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

import User from './user.js'
import Ticket from './ticket.js'
import Vendor from './event_vendor.js'
import EventVendor from './event_vendor.js'
import VendorService from './vendor_service.js'

BaseModel.namingStrategy = new SnakeCaseNamingStrategy()

export interface ThemeSettings {
  template:
    | 'default'
    | 'minimal'
    | 'modern'
    | 'classic'
    | 'elegant'
    | 'creative'
    | 'vintage'
    | 'futuristic'
    | 'retro'
    | 'gothic'
    | 'boho'
    | 'hipster'
  primary_color: string
  secondary_color: string
  font_family: string
  hero_layout: string
  show_countdown: boolean
}

export default class Event extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  declare description: string

  @column()
  declare custom_url: string

  @column()
  declare vendor_charge: number

  @column()
  declare event_category: string

  @column()
  declare event_type: 'offline' | 'online' | 'hybrid'

  @column()
  declare event_frequency: 'single' | 'recurring'

  @column.date()
  declare start_date: DateTime

  @column.date()
  declare end_date: DateTime

  @column()
  declare start_time: string

  @column()
  declare end_time: string

  @column()
  declare timezone: string

  @column()
  declare location: string

  @column()
  declare capacity: number

  @column()
  declare status: 'draft' | 'published'

  @column()
  declare user_id: number

  @column()
  declare theme_settings: {
    template: string
    primary_color: string
    secondary_color: string
    font_family: string
    hero_layout: string
    show_countdown: boolean
    custom_css?: string
    custom_domain?: string
  }

  @column()
  declare social_details: {
    website_url?: string
    instagram_handle?: string
    twitter_handle?: string
    audiomack_url?: string
    facebook_url?: string
  }

  @column()
  declare social_metrics: {
    facebook: { shares: number; views: number; clicks: number }
    twitter: { shares: number; views: number; clicks: number }
    instagram: { shares: number; views: number; clicks: number }
    whatsapp: { shares: number; views: number; clicks: number }
  }

  @column({
    prepare: (value: string[]) => (Array.isArray(value) ? JSON.stringify(value) : value),
    consume: (value: string) => {
      if (!value) return []
      return typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))
        ? JSON.parse(value)
        : [value]
    },
  })
  declare thumbnails: { url: string; key: string }[]

  @column()
  declare confirmation_message: string
  @column()
  declare event_sale_status: {
    type: 'none' | 'pre_sale' | 'post_sale'
    pre_sale_message: string
    post_sale_message: string
  }

  @belongsTo(() => User, {
    foreignKey: 'user_id',
  })
  declare user: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  @hasMany(() => Ticket, {
    foreignKey: 'event_id',
  })
  declare tickets: HasMany<typeof Ticket>

  @hasMany(() => EventVendor, {
    foreignKey: 'event_id',
  })
  declare vendors: HasMany<typeof EventVendor>

  @hasMany(() => VendorService, {
    foreignKey: 'user_id',
  })
  declare services: HasMany<typeof VendorService>
}
