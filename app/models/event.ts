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
import { v4 as uuidv4 } from 'uuid'

import User from './user.js'

import Ticket from './ticket.js'
import Vendor from './vendor.js'

BaseModel.namingStrategy = new SnakeCaseNamingStrategy()

export interface ThemeSettings {
  template:
    | 'default'
    | 'minimalist'
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
    | 'minimalist'
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
  declare id: string

  @column()
  declare title: string

  @column()
  declare description: string

  @column()
  declare custom_url: string

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
  declare status: 'draft' | 'published' | 'cancelled'

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
  declare thumbnails: { url: string; key: string }[]

  @column()
  declare user_id: string

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  @hasMany(() => Ticket)
  declare tickets: HasMany<typeof Ticket>

  @manyToMany(() => Vendor, {
    pivotTable: 'event_vendors',
    pivotColumns: [
      'status',
      'notes',
      'services',
      'agreed_price',
      'booth_location',
      'booth_number',
      'setup_time',
      'teardown_time',
    ],
  })
  declare vendors: ManyToMany<typeof Vendor>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
