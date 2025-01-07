import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'event_addons'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('event_id').references('id').inTable('events').onDelete('CASCADE')
      table.string('name').notNullable()
      table.text('description').nullable()
      table.decimal('price', 10, 2).notNullable()
      table.enum('type', ['one_time', 'recurring']).notNullable()
      table.integer('quantity_available').notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
