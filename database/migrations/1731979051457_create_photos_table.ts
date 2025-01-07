import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'photos'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('event_id').references('id').inTable('events').onDelete('CASCADE')
      table.integer('photographer_id').references('id').inTable('users').onDelete('CASCADE')
      table.dateTime('taken_at').notNullable()
      table.string('photo_url').notNullable()
      table.enum('status', ['pending', 'approved', 'rejected']).notNullable()
      table.dateTime('uploaded_at').notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
