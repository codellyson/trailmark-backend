import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'addons'

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

      // Add-on Details
      table.string('name').notNullable()
      table.text('description').nullable()
      table
        .enum('type', ['photography', 'equipment_rental', 'transportation', 'custom'])
        .notNullable()

      // Pricing
      table.decimal('price', 10, 2).notNullable()
      table.string('currency').notNullable()
      table.string('currency_symbol').notNullable()

      // Capacity & Availability
      table.integer('capacity').unsigned().nullable()
      table.integer('sold_count').unsigned().defaultTo(0)
      table.integer('reserved_count').unsigned().defaultTo(0)

      // Photography specific fields
      table.integer('photo_count').unsigned().nullable()
      table
        .integer('photographer_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .nullable()

      // Equipment specific fields
      table.jsonb('equipment_details').nullable()

      // Transportation specific fields
      table.jsonb('transportation_details').nullable()

      // Status
      table.enum('status', ['active', 'inactive', 'sold_out']).defaultTo('active')

      // Timestamps
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    // Add indexes
    this.schema.alterTable(this.tableName, (table) => {
      table.index(['event_id', 'type', 'status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
