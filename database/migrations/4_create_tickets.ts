import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tickets'

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
        .integer('booking_id')
        .unsigned()
        .references('id')
        .inTable('bookings')
        .onDelete('CASCADE')
        .notNullable()

      // Ticket Details
      table.string('ticket_number').unique().notNullable()
      table.string('ticket_type').notNullable()
      table.decimal('price', 10, 2).notNullable()
      table.jsonb('ticket_metadata').defaultTo('{}')

      // Attendee Information
      table.string('attendee_name').notNullable()
      table.string('attendee_email').notNullable()
      table.string('attendee_phone').nullable()
      table.jsonb('attendee_details').defaultTo('{}')

      // Status & Validation
      table
        .enum('status', ['valid', 'used', 'cancelled', 'refunded', 'transferred'])
        .defaultTo('valid')
      table.boolean('is_validated').defaultTo(false)
      table.timestamp('validated_at', { useTz: true }).nullable()
      table.string('validated_by').nullable()

      // Transfer Information
      table.boolean('is_transferable').defaultTo(true)
      table.boolean('is_transferred').defaultTo(false)
      table.integer('transferred_from_id').unsigned().nullable()
      table.integer('transferred_to_id').unsigned().nullable()
      table.timestamp('transferred_at', { useTz: true }).nullable()

      // QR Code & Access
      table.string('qr_code').unique().notNullable()
      table.string('access_code').unique().nullable()
      table.jsonb('access_restrictions').defaultTo('{}')

      // Add-ons
      table.jsonb('selected_addons').defaultTo('[]')
      table.decimal('addons_total', 10, 2).defaultTo(0)

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
