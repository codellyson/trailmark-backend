import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'bookings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('event_id').references('id').inTable('events').onDelete('CASCADE')
      table.integer('user_id').references('id').inTable('users').onDelete('CASCADE')
      table.boolean('photography_included').notNullable()
      table.boolean('waiver_signed').notNullable()
      table.decimal('total_amount', 10, 2).notNullable()
      table.string('ticket_number').notNullable()
      table.enum('status', ['pending', 'confirmed', 'cancelled', 'refunded']).notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
