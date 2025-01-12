import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'escrow_accounts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

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

      table.decimal('amount', 15, 2).notNullable()
      table.string('currency').defaultTo('USD')

      table.enum('status', ['held', 'released', 'cancelled', 'refunded']).defaultTo('held')

      table.timestamp('held_at', { useTz: true }).notNullable()
      table.timestamp('release_date', { useTz: true }).nullable()
      table.timestamp('released_at', { useTz: true }).nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
