import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'ticket_upgrades'

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

      // Basic Info
      table.string('name').notNullable()
      table.text('description').nullable()
      table.decimal('price', 10, 2).notNullable()
      table.string('currency').defaultTo('NGN')

      // Type & Configuration
      table
        .enum('type', ['vip_access', 'parking', 'merchandise', 'insurance', 'seating', 'other'])
        .defaultTo('other')
      table.boolean('is_active').defaultTo(true)
      table.integer('quantity_available').nullable()

      // Availability
      table.timestamp('available_from', { useTz: true }).nullable()
      table.timestamp('available_until', { useTz: true }).nullable()

      // Restrictions
      table.jsonb('allowed_ticket_types').defaultTo('[]')
      table.integer('max_per_ticket').nullable()

      // Display
      table.string('image_url').nullable()
      table.integer('display_order').defaultTo(0)

      // Basic Tracking
      table.integer('times_purchased').defaultTo(0)
      table.decimal('total_revenue', 10, 2).defaultTo(0)

      // Timestamps
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
