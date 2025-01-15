import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'photography_services'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('addon_id')
        .unsigned()
        .references('id')
        .inTable('addons')
        .onDelete('CASCADE')
        .notNullable()

      table
        .integer('event_id')
        .unsigned()
        .references('id')
        .inTable('events')
        .onDelete('CASCADE')
        .notNullable()

      table
        .integer('photographer_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .notNullable()

      table
        .enum('status', [
          'pending',
          'accepted',
          'rejected',
          'in_progress',
          'completed',
          'delivered',
          'cancelled',
        ])
        .defaultTo('pending')

      table.decimal('price', 15, 2).notNullable()
      table.integer('photo_count').nullable()
      table.timestamp('event_date').notNullable()
      table.timestamp('accepted_at').nullable()
      table.timestamp('completed_at').nullable()
      table.timestamp('delivered_at').nullable()
      // Timestamps
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      // Indexes for better query performance
      table.index(['photographer_id', 'status'])
      table.index('event_date')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
