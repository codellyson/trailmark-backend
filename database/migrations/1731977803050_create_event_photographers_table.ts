import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'event_photographers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('event_id').references('id').inTable('events').onDelete('CASCADE')
      table.integer('photographer_id').references('id').inTable('users').onDelete('CASCADE')
      table.decimal('price_per_person').notNullable()
      table.enum('status', ['pending', 'confirmed', 'rejected']).notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
