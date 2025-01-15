import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, SnakeCaseNamingStrategy } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Event from './event.js'
import User from './user.js'

BaseModel.namingStrategy = new SnakeCaseNamingStrategy()
export default class Photo extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare event_id: number

  @column()
  declare photography_service_id: number

  @column()
  declare url: string

  @column()
  declare thumbnail_url: string | null

  @column()
  declare original_filename: string | null

  @column()
  declare mime_type: string | null

  @column()
  declare size_in_bytes: number | null

  @column()
  declare width: number | null

  @column()
  declare height: number | null

  @column()
  declare metadata: {
    camera?: string
    lens?: string
    aperture?: string
    shutterSpeed?: string
    iso?: number
    location?: {
      latitude?: number
      longitude?: number
    }
    [key: string]: any
  }

  @column()
  declare status: 'uploading' | 'processing' | 'ready' | 'failed'

  @column()
  declare is_public: boolean

  @column()
  declare is_featured: boolean

  @column.dateTime()
  declare taken_at: DateTime | null

  @column.dateTime()
  declare uploaded_at: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relationships
  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>

  @belongsTo(() => User, {
    foreignKey: 'photographerId',
  })
  declare photographer: BelongsTo<typeof User>

  // Helper methods
  getFormattedSize(): string {
    if (!this.size_in_bytes) return 'Unknown'

    const sizes = ['B', 'KB', 'MB', 'GB']
    let size = this.size_in_bytes
    let i = 0

    while (size >= 1024 && i < sizes.length - 1) {
      size /= 1024
      i++
    }

    return `${size.toFixed(2)} ${sizes[i]}`
  }

  getDimensions(): string {
    if (!this.width || !this.height) return 'Unknown'
    return `${this.width}x${this.height}`
  }
}
