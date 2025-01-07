import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Event from './event.js'
import PhotoGallery from './photo_gallery.js'
import User from './user.js'

export default class Photo extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare eventId: number

  @column()
  declare bookingId: number

  @column()
  declare photographerId: number

  @column()
  declare filePath: string

  @column.dateTime()
  declare takenAt: DateTime

  @column()
  declare status: 'pending' | 'approved' | 'rejected'

  @column.dateTime()
  declare uploadedAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'photographerId' })
  declare photographer: BelongsTo<typeof User>

  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>

  @hasMany(() => PhotoGallery)
  declare galleries: HasMany<typeof PhotoGallery>
}
