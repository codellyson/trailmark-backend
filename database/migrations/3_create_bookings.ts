import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'bookings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Relations
      table
        .integer('event_id')
        .unsigned()
        .references('id')
        .inTable('events')
        .onDelete('CASCADE')
        .notNullable()

      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .notNullable()

      // Booking Details
      table.string('booking_reference').unique().notNullable()
      table
        .enum('status', ['pending', 'confirmed', 'cancelled', 'refunded', 'waitlisted', 'attended'])
        .defaultTo('pending')

      // Ticket Information
      table.jsonb('tickets').defaultTo('[]')
      table.integer('total_tickets').unsigned().notNullable()
      table.decimal('subtotal', 10, 2).notNullable()
      table.decimal('tax', 10, 2).defaultTo(0)
      table.decimal('total_amount', 10, 2).notNullable()

      // Add-ons & Extras
      table.jsonb('selected_addons').defaultTo('[]')
      table.decimal('addons_total', 10, 2).defaultTo(0)

      // Payment Information
      table
        .enum('payment_status', ['pending', 'processing', 'completed', 'failed', 'refunded'])
        .defaultTo('pending')
      table.string('payment_method').nullable()
      table.string('payment_reference').nullable()
      table.jsonb('payment_details').defaultTo('{}')

      // Attendee Information
      table.jsonb('attendee_details').defaultTo('[]')
      table.boolean('waiver_accepted').defaultTo(false)
      table.timestamp('waiver_accepted_at', { useTz: true }).nullable()

      // Check-in Details
      table.boolean('is_checked_in').defaultTo(false)
      table.timestamp('checked_in_at', { useTz: true }).nullable()
      table.string('checked_in_by').nullable()

      // Cancellation & Refund
      table.boolean('is_cancelled').defaultTo(false)
      table.timestamp('cancelled_at', { useTz: true }).nullable()
      table.string('cancellation_reason').nullable()
      table.decimal('refund_amount', 10, 2).nullable()
      table.timestamp('refunded_at', { useTz: true }).nullable()

      // Notes & Communication
      table.text('admin_notes').nullable()
      table.jsonb('communication_history').defaultTo('[]')

      // Timestamps
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.timestamp('expires_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
