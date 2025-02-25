import { BaseModel, belongsTo, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import User from './user.js'
import Event from './event.js'

export type VendorCategory = 'photographer' | 'caterer' | 'decorator' | 'musician' | 'venue' | 'other'
export type VendorStatus = 'pending' | 'active' | 'suspended' | 'inactive'

export default class Vendor extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: number

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @column()
  declare businessName: string

  @column()
  declare description: string

  @column()
  declare category: VendorCategory

  @column()
  declare status: VendorStatus

  @column({
    prepare: (value: string[]) => JSON.stringify(value),
    consume: (value: string) => JSON.parse(value),
  })
  declare services: string[]

  @column({
    prepare: (value: Array<{ url: string; key: string }>) => JSON.stringify(value),
    consume: (value: string) => JSON.parse(value),
  })
  declare portfolioImages: Array<{ url: string; key: string }>

  @column()
  declare contactEmail: string

  @column()
  declare contactPhone: string

  @column()
  declare address: string

  @column({
    prepare: (value: { lat: number; lng: number }) => JSON.stringify(value),
    consume: (value: string) => JSON.parse(value),
  })
  declare location: { lat: number; lng: number }

  @column({
    prepare: (value: { [key: string]: string }) => JSON.stringify(value),
    consume: (value: string) => JSON.parse(value),
  })
  declare socialMedia: {
    facebook?: string
    instagram?: string
    twitter?: string
    website?: string
  }

  @column()
  declare averageRating: number

  @column()
  declare totalReviews: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @manyToMany(() => Event)
  declare events: ManyToMany<typeof Event>
}
