import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'event_vendors'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Foreign keys
      table.integer('event_id').unsigned().references('id').inTable('events').onDelete('CASCADE')
      table.integer('vendor_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      // Additional fields
      table.enum('status', ['pending', 'approved', 'rejected']).defaultTo('pending')
      table.decimal('agreed_price', 10, 2).nullable() // If there's a specific price agreed
      table.string('booth_location').nullable() // For physical events
      table.string('booth_number').nullable() // For physical events
      table.dateTime('setup_time').nullable() // When the vendor should setup
      table.dateTime('teardown_time').nullable() // When the vendor should teardown
      table.string('service_id').nullable() // The service id of the vendor

      // Timestamps
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      // Ensure unique vendor per event
      table.unique(['event_id', 'vendor_id'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
