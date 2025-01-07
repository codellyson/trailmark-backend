import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'events'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('organizer_id').references('id').inTable('users').onDelete('CASCADE')
      table.string('title').notNullable()
      table.text('description').notNullable()
      table.timestamp('date', { useTz: true }).notNullable()
      table.string('start_time').notNullable()
      table.string('end_time').notNullable()
      table.string('location').notNullable()
      table.enum('event_type', ['online', 'offline']).notNullable(),
        // Ticket Information
        table.decimal('ticket_price', 10, 2).defaultTo(0)
      table.string('ticket_name').nullable()
      table.text('ticket_description').nullable()
      table.integer('ticket_capacity').defaultTo(0)
      table.boolean('early_bird').defaultTo(false)
      table.decimal('early_bird_price', 10, 2).defaultTo(0)
      table.timestamp('early_bird_end', { useTz: true }).nullable()
      table.timestamp('sales_start_date', { useTz: true }).nullable()
      table.timestamp('sales_deadline', { useTz: true }).nullable()
      table.string('ticket_type').nullable()
      table.string('ticket_currency').defaultTo('NGN')
      table.string('ticket_currency_symbol').defaultTo('₦')
      // Add-ons (stored as JSON)
      table.json('add_ons').defaultTo(
        JSON.stringify({
          photography_addons: {
            enabled: false,
            packages: [],
          },
          equipment_rentals: {
            enabled: false,
            packages: [],
          },
          transportation_services: {
            enabled: false,
            price: 0,
            name: '',
            description: '',
          },
          custom_addons: {
            enabled: false,
            packages: [],
          },
        })
      ),
        // Timestamps
        table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
