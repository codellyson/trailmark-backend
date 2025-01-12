import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'event_payments'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('customer_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .notNullable()

      table
        .integer('event_id')
        .unsigned()
        .references('id')
        .inTable('events')
        .onDelete('CASCADE')
        .notNullable()

      table.decimal('amount', 15, 2).notNullable()
      table.decimal('platform_fee', 15, 2).defaultTo(0)
      table.decimal('photographer_fee', 15, 2).nullable()

      table.string('currency').defaultTo('USD')

      table
        .enum('status', ['pending', 'processing', 'completed', 'failed', 'refunded'])
        .defaultTo('pending')

      table.string('payment_method').notNullable()
      table.string('payment_reference').nullable()

      table.jsonb('metadata').defaultTo('{}')

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.timestamp('paid_at').nullable()
      table.timestamp('refunded_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
