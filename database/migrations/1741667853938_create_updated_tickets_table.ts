import { BaseSchema } from '@adonisjs/lucid/schema'

// Example migration file
export default class extends BaseSchema {
  protected tableName = 'tickets'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('event_id').unsigned().references('id').inTable('events').onDelete('CASCADE')
      table.string('name').notNullable()
      table.decimal('price', 10, 2).notNullable().defaultTo(0)
      table.integer('quantity_available').notNullable()
      table.integer('quantity_sold').notNullable().defaultTo(0)
      table.boolean('is_unlimited').defaultTo(false)
      table.enum('type', ['free', 'paid', 'invite-only']).notNullable()
      table.enum('status', ['draft', 'active', 'paused', 'sold_out', 'expired']).defaultTo('draft')
      table.text('description').nullable()
      table.json('perks').nullable()
      table.integer('group_size').notNullable().defaultTo(1)
      table.integer('min_per_order').nullable()
      table.integer('max_per_order').nullable()
      table.timestamp('sale_starts_at').nullable()
      table.timestamp('sale_ends_at').nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }
}
