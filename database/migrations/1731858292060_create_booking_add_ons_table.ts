import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'booking_add_ons'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('booking_id').references('id').inTable('bookings').onDelete('CASCADE')
      table.integer('quantity').notNullable()
      table.integer('addon_id').references('id').inTable('event_addons').onDelete('CASCADE')
      table.decimal('price_at_time', 10, 2).notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
