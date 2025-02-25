import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'event_vendors'

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
        .integer('vendor_id')
        .unsigned()
        .references('id')
        .inTable('vendors')
        .onDelete('CASCADE')
        .notNullable()

      // Status
      table.enum('status', ['pending', 'approved', 'rejected', 'cancelled']).defaultTo('pending')
      table.text('rejection_reason').nullable()

      // Vendor Space Details
      table.string('booth_number').nullable()
      table.string('location_description').nullable()
      table.jsonb('space_requirements').defaultTo('{}')
      table.jsonb('equipment_requirements').defaultTo('[]')

      // Financial Terms
      table.decimal('booth_fee', 10, 2).nullable()
      table.decimal('commission_rate', 5, 2).nullable()
      table.jsonb('payment_schedule').defaultTo('[]')
      table.boolean('payment_completed').defaultTo(false)

      // Schedule
      table.timestamp('setup_time', { useTz: true }).nullable()
      table.timestamp('teardown_time', { useTz: true }).nullable()
      table.jsonb('operating_hours').defaultTo('{}')

      // Requirements & Compliance
      table.boolean('insurance_verified').defaultTo(false)
      table.boolean('agreement_signed').defaultTo(false)
      table.timestamp('agreement_signed_at', { useTz: true }).nullable()
      table.jsonb('required_documents').defaultTo('[]')

      // Products & Services
      table.jsonb('approved_items').defaultTo('[]')
      table.jsonb('restricted_items').defaultTo('[]')
      table.text('special_notes').nullable()

      // Metrics
      table.decimal('total_sales', 10, 2).defaultTo(0)
      table.integer('total_transactions').defaultTo(0)
      table.jsonb('sales_data').defaultTo('{}')

      // Timestamps
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      // Unique constraint to prevent duplicate vendor assignments
      table.unique(['event_id', 'vendor_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
