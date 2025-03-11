import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Ticket from './ticket.js'
import Event from './event.js'
import User from './user.js'
import { SnakeCaseNamingStrategy } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export enum TicketSaleStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  TRANSFERRED = 'transferred',
}

BaseModel.namingStrategy = new SnakeCaseNamingStrategy()

export default class TicketSale extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare ticket_id: number

  @column()
  declare event_id: number

  @column()
  declare buyer_id: number

  @column()
  declare payment_reference: string

  @column()
  declare quantity: number

  @column()
  declare amount_paid: number

  @column()
  declare platform_fee: number

  @column()
  declare status: TicketSaleStatus

  @column({ serialize: (value: string) => JSON.parse(value) })
  declare metadata?: Record<string, any>

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  // Relationships
  @belongsTo(() => Ticket)
  declare ticket: BelongsTo<typeof Ticket>

  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>

  @belongsTo(() => User)
  declare buyer: BelongsTo<typeof User>

  // Methods
  public async markAsCompleted() {
    this.status = TicketSaleStatus.COMPLETED
    await this.save()

    // Update ticket quantity sold
    const ticket = await this.ticket
    ticket.quantity_sold += this.quantity
    await ticket.save()
  }

  public async markAsRefunded() {
    this.status = TicketSaleStatus.REFUNDED
    await this.save()

    // Update ticket quantity sold
    const ticket = await this.ticket
    ticket.quantity_sold -= this.quantity
    await ticket.save()
  }
}
