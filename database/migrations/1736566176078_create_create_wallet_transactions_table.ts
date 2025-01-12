import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'wallet_transactions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('wallet_id')
        .unsigned()
        .references('id')
        .inTable('wallets')
        .onDelete('CASCADE')
        .notNullable()

      // Transaction types
      table
        .enum('type', [
          // Photographer transactions
          'event_payment_received',
          'payout_request',
          'platform_fee',

          // Organizer transactions
          'ticket_sale_revenue',
          'photographer_fee',
          'refund_issued',

          // Common transactions
          'withdrawal',
          'adjustment',
        ])
        .notNullable()

      table.decimal('amount', 15, 2).notNullable()
      table.decimal('fee', 15, 2).defaultTo(0)
      table.decimal('balance_after', 15, 2).notNullable()

      table
        .enum('status', ['pending', 'processing', 'completed', 'failed', 'cancelled'])
        .defaultTo('pending')

      table.string('currency').defaultTo('USD')

      table
        .enum('reference_type', ['event', 'event_payment', 'escrow', 'payout', 'adjustment'])
        .nullable()

      table.integer('reference_id').nullable()

      table.jsonb('metadata').defaultTo('{}')

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.timestamp('processed_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
