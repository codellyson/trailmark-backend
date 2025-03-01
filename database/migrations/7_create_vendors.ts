import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'vendors'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Foreign keys
      table.integer('event_id').unsigned().references('id').inTable('events').onDelete('CASCADE')
      table.integer('vendor_id').unsigned().references('id').inTable('vendors').onDelete('CASCADE')

      // Additional fields
      table.enum('status', ['pending', 'confirmed', 'rejected', 'cancelled']).defaultTo('pending')
      table.text('notes').nullable() // For any special requirements or notes
      table.json('services').defaultTo('[]') // List of services the vendor will provide
      table.decimal('agreed_price', 10, 2).nullable() // If there's a specific price agreed
      table.string('booth_location').nullable() // For physical events
      table.string('booth_number').nullable() // For physical events
      table.dateTime('setup_time').nullable() // When the vendor should setup
      table.dateTime('teardown_time').nullable() // When the vendor should teardown

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
