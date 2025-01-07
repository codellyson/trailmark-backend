import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'photo_galleries'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('photo_id').references('id').inTable('photos').onDelete('CASCADE')
      table
        .integer('booking_id')
        .nullable()
        .references('id')
        .inTable('bookings')
        .onDelete('CASCADE')
      table.integer('event_id').nullable().references('id').inTable('events').onDelete('CASCADE')
      table.enum('gallery_type', ['booking_private', 'event_private', 'event_public']).notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
