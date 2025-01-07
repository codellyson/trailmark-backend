import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Booking from './booking.js'
import Event from './event.js'
import Photo from './photo.js'

export default class PhotoGallery extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare photoId: string

  @column()
  declare galleryType: 'booking_private' | 'event_private' | 'event_public'
  @column()
  declare bookingId: number | null

  @column()
  declare eventId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Photo)
  declare photo: BelongsTo<typeof Photo>

  @belongsTo(() => Booking)
  declare booking: BelongsTo<typeof Booking>

  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>
}
