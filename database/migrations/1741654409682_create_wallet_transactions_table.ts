import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'wallet_transactions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('wallet_id').unsigned().references('id').inTable('wallets').onDelete('CASCADE')
      table.decimal('amount', 10, 2)
      table.enum('type', ['credit', 'debit']).notNullable()
      table.string('reference').notNullable()
      table.string('description')
      table.enum('status', ['pending', 'completed', 'failed']).defaultTo('pending')
      table.string('payment_method')
      table.json('metadata')
      table.decimal('balance_before', 10, 2)
      table.decimal('balance_after', 10, 2)
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
