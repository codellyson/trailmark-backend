import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'wallet_transactions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Relations
      table
        .integer('wallet_id')
        .unsigned()
        .references('id')
        .inTable('wallets')
        .onDelete('CASCADE')
        .notNullable()

      // Transaction Info
      table.string('reference').notNullable().unique()
      table.enum('type', ['credit', 'debit', 'refund', 'reversal', 'escrow']).notNullable()
      table.decimal('amount', 10, 2).notNullable()
      table.string('currency').notNullable()
      table.decimal('balance_before', 10, 2).notNullable()
      table.decimal('balance_after', 10, 2).notNullable()

      // Transaction Details
      table.string('description').notNullable()
      table.enum('status', ['pending', 'completed', 'failed', 'reversed']).defaultTo('pending')
      table.string('payment_method').nullable()
      table.string('payment_reference').nullable()
      table.jsonb('metadata').defaultTo('{}')

      // Source/Destination
      table.string('source_type').nullable()
      table.integer('source_id').unsigned().nullable()
      table.string('destination_type').nullable()
      table.integer('destination_id').unsigned().nullable()

      // Processing Info
      table.string('processor').nullable()
      table.string('processor_reference').nullable()
      table.jsonb('processor_response').defaultTo('{}')
      table.text('failure_reason').nullable()

      // Timestamps
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.timestamp('processed_at', { useTz: true }).nullable()

      // Indexes
      table.index(['wallet_id', 'type', 'status'])
      table.index(['reference'])
      table.index(['payment_reference'])
      table.index(['processor_reference'])
      table.index(['created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
