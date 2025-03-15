import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'event_vendors'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('event_id').unsigned().references('id').inTable('events').onDelete('CASCADE')
      table.integer('vendor_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.enum('status', ['pending', 'approved', 'rejected']).defaultTo('pending')
      table.string('booth_location').nullable()
      table.string('booth_number').nullable()
      table.dateTime('setup_time').nullable()
      table.dateTime('teardown_time').nullable()
      table.string('service_id').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      // Add unique constraint including service_id
      table.unique(['event_id', 'vendor_id', 'service_id'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
