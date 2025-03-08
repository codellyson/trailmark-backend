import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, SnakeCaseNamingStrategy } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Ticket from './ticket.js'

// Set the naming strategy for the model
BaseModel.namingStrategy = new SnakeCaseNamingStrategy()

export type QuestionType =
  | 'text'
  | 'number'
  | 'date'
  | 'time'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'file'

export interface FileSettings {
  allowed_types: string[]
  max_size: number
  max_files: number
}

export default class TicketCustomQuestion extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({
    prepare: (value: any) => {
      if (Array.isArray(value)) {
        return JSON.stringify(value.map((item, index) => ({ [index]: item })))
      }
      return JSON.stringify(value)
    },
    consume: (value: string) => {
      try {
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed)) {
          return parsed.map((item) => Object.values(item)[0])
        }
        return parsed
      } catch (error) {
        return []
      }
    },
  })
  declare custom_questions: any

  @column()
  declare event_id: number

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  // Relationships
  @belongsTo(() => Ticket)
  declare ticket: BelongsTo<typeof Ticket>
}
