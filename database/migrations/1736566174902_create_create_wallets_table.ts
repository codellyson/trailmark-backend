import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'wallets'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .notNullable()

      table.decimal('available_balance', 15, 2).defaultTo(0)
      table.decimal('pending_balance', 15, 2).defaultTo(0)
      table.decimal('total_earnings', 15, 2).defaultTo(0)

      table.string('currency').defaultTo('USD')
      table.string('currency_symbol').defaultTo('$')

      // Payment methods and payout settings as JSON
      table.jsonb('payment_methods').defaultTo('[]')
      table.jsonb('payout_settings').defaultTo('{}')

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
