import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tickets'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Event Relation
      table
        .integer('event_id')
        .unsigned()
        .references('id')
        .inTable('events')
        .onDelete('CASCADE')
        .notNullable()

      // Ticket Details
      table.string('name').notNullable()
      table.text('description').nullable()
      table.enum('type', ['general', 'vip', 'early_bird']).defaultTo('general')

      // Pricing
      table.decimal('price', 10, 2).notNullable()
      table.string('currency').notNullable()
      table.string('currency_symbol').notNullable()

      // Capacity
      table.integer('capacity').unsigned().nullable()
      table.integer('sold_count').unsigned().defaultTo(0)
      table.integer('reserved_count').unsigned().defaultTo(0)

      // Sales Period
      table.timestamp('sales_start_date').nullable()
      table.timestamp('sales_end_date').nullable()

      // Status
      table.enum('status', ['draft', 'active', 'sold_out', 'expired']).defaultTo('draft')

      // Timestamps
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    // Add indexes
    this.schema.alterTable(this.tableName, (table) => {
      table.index(['event_id', 'status'])
      table.index('type')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
