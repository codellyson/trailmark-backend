import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'bookings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Relations
      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .notNullable()

      table
        .integer('event_id')
        .unsigned()
        .references('id')
        .inTable('events')
        .onDelete('CASCADE')
        .notNullable()

      // Booking Details
      table.string('booking_reference').unique().notNullable()
      table
        .enum('status', ['pending', 'confirmed', 'cancelled', 'completed', 'refunded'])
        .defaultTo('pending')

      // Ticket Information
      table.jsonb('selected_tickets').notNullable().defaultTo('[]')
      table.jsonb('selected_addons').defaultTo('[]')

      // Payment Information
      table.decimal('total_amount', 10, 2).notNullable()
      table.string('currency').notNullable()
      table.string('payment_status').defaultTo('pending')
      table.string('payment_reference').nullable()
      table.jsonb('payment_details').defaultTo('{}')

      // Attendee Information
      table.jsonb('attendee_details').defaultTo('{}')

      // Waiver
      table.boolean('waiver_accepted').defaultTo(false)
      table.timestamp('waiver_accepted_at').nullable()

      // Check-in Details
      table.boolean('checked_in').defaultTo(false)
      table.timestamp('checked_in_at').nullable()

      // Timestamps
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.timestamp('cancelled_at', { useTz: true }).nullable()
    })

    // Add indexes for better query performance
    this.schema.alterTable(this.tableName, (table) => {
      table.index(['user_id', 'event_id'])
      table.index('booking_reference')
      table.index('status')
      table.index('payment_status')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
