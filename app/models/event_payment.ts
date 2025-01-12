import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Event from './event.js'

export default class EventPayment extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare customer_id: number

  @column()
  declare event_id: number

  @column()
  declare amount: number

  @column()
  declare platform_fee: number

  @column()
  declare photographer_fee: number | null

  @column()
  declare currency: string

  @column()
  declare status:
    | 'pending' // Initial state
    | 'processing' // Payment being processed
    | 'completed' // Payment successful
    | 'failed' // Payment failed
    | 'refunded' // Payment refunded

  @column()
  declare payment_method: string

  @column()
  declare payment_reference: string | null

  @column()
  declare metadata: {
    payment_initiated_at?: string
    payment_completed_at?: string
    refund_reason?: string
    gateway_response?: Record<string, any>
    customer_info?: {
      name?: string
      email?: string
      phone?: string
    }
    [key: string]: any
  }

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare paidAt: DateTime | null

  @column.dateTime()
  declare refundedAt: DateTime | null

  @belongsTo(() => User, {
    foreignKey: 'customer_id',
  })
  declare customer: BelongsTo<typeof User>

  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>

  /**
   * Get formatted amount with currency
   */
  getFormattedAmount(): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency,
    }).format(this.amount)
  }

  /**
   * Calculate fee distributions
   */
  getFeeDistribution() {
    return {
      total: this.amount,
      platform_fee: this.platform_fee,
      photographer_fee: this.photographer_fee || 0,
      organizer_share: this.amount - this.platform_fee - (this.photographer_fee || 0),
    }
  }

  /**
   * Check if payment is refundable
   */
  isRefundable(): boolean {
    if (!this.paidAt) return false

    const daysSincePayment = DateTime.now().diff(this.paidAt, 'days').days
    return (
      this.status === 'completed' &&
      daysSincePayment <= 30 && // 30-day refund window
      !this.refundedAt
    )
  }

  /**
   * Process refund
   */
  async processRefund(reason: string) {
    if (!this.isRefundable()) {
      throw new Error('Payment is not refundable')
    }

    // Update payment status
    this.status = 'refunded'
    this.refundedAt = DateTime.now()
    this.metadata = {
      ...this.metadata,
      refund_reason: reason,
      refunded_at: DateTime.now().toISO(),
    }

    await this.save()

    // Return funds to customer (implement payment gateway refund here)
    // await refundPaymentGateway(this.paymentReference)

    return this
  }
}
