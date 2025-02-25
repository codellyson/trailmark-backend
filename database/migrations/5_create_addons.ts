import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'addons'

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
      table.string('currency').defaultTo('USD')

      // Configuration
      table.enum('type', ['service', 'product', 'upgrade', 'other']).defaultTo('service')
      table.boolean('is_required').defaultTo(false)
      table.boolean('is_active').defaultTo(true)
      table.integer('quantity_available').nullable()
      table.integer('min_quantity').defaultTo(1)
      table.integer('max_quantity').nullable()

      // Pricing & Revenue
      table.decimal('cost_price', 10, 2).nullable()
      table.decimal('revenue_share_percentage', 5, 2).nullable()
      table.jsonb('pricing_tiers').defaultTo('[]')
      table.boolean('is_taxable').defaultTo(true)
      table.decimal('tax_rate', 5, 2).nullable()

      // Availability
      table.timestamp('available_from', { useTz: true }).nullable()
      table.timestamp('available_until', { useTz: true }).nullable()
      table.jsonb('availability_rules').defaultTo('{}')

      // Dependencies & Restrictions
      table.jsonb('required_ticket_types').defaultTo('[]')
      table.jsonb('excluded_ticket_types').defaultTo('[]')
      table.jsonb('dependencies').defaultTo('[]')
      table.jsonb('restrictions').defaultTo('{}')

      // Media & Display
      table.string('image_url').nullable()
      table.integer('display_order').defaultTo(0)
      table.jsonb('display_options').defaultTo('{}')

      // Tracking & Analytics
      table.integer('times_purchased').defaultTo(0)
      table.decimal('total_revenue', 10, 2).defaultTo(0)
      table.jsonb('analytics_data').defaultTo('{}')

      // Timestamps
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
