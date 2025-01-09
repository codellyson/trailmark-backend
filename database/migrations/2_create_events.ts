import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'events'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Relations
      table
        .integer('organizer_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .notNullable()

      // Basic Info
      table.string('title').notNullable()
      table.text('description').notNullable()
      table.string('slug').unique().notNullable()
      table.integer('capacity').unsigned().nullable()

      // Time & Location
      table.date('date').notNullable()
      table.string('start_time').notNullable()
      table.string('end_time').notNullable()
      table.string('location').notNullable()

      // Type & Status
      table.enum('event_type', ['online', 'offline', 'hybrid']).defaultTo('offline')
      table.enum('status', ['draft', 'published', 'cancelled', 'completed']).defaultTo('draft')

      // Media
      table.jsonb('thumbnails').defaultTo('[]')

      // Event Options
      table.jsonb('ticket_options').defaultTo('[]')
      table.jsonb('add_ons').defaultTo('{}')
      table.jsonb('waiver').defaultTo('{}')

      // Timestamps
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
