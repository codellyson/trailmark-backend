import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'wallets'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Relations
      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .notNullable()
        .unique()

      // Balance Info
      table.decimal('balance', 10, 2).notNullable().defaultTo(0)
      table.decimal('escrow_balance', 10, 2).notNullable().defaultTo(0)
      table.decimal('pending_balance', 10, 2).notNullable().defaultTo(0)
      table.string('currency').notNullable().defaultTo('NGN')

      // Wallet Status
      table.enum('status', ['active', 'frozen', 'suspended']).defaultTo('active')
      table.boolean('is_verified').defaultTo(false)
      table.timestamp('verified_at', { useTz: true }).nullable()

      // Limits & Settings
      table.decimal('daily_limit', 10, 2).nullable()
      table.decimal('monthly_limit', 10, 2).nullable()
      table.decimal('transaction_limit', 10, 2).nullable()
      table.jsonb('withdrawal_settings').defaultTo('{}')
      table.jsonb('notification_settings').defaultTo('{}')

      // Metrics
      table.decimal('total_credited', 10, 2).notNullable().defaultTo(0)
      table.decimal('total_debited', 10, 2).notNullable().defaultTo(0)
      table.integer('total_transactions').notNullable().defaultTo(0)
      table.timestamp('last_transaction_at', { useTz: true }).nullable()

      // Security
      table.string('pin_hash').nullable()
      table.integer('failed_attempts').defaultTo(0)
      table.timestamp('locked_until', { useTz: true }).nullable()
      table.jsonb('security_settings').defaultTo('{}')

      // Timestamps
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      // Indexes
      table.index(['user_id', 'status'])
      table.index(['currency'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
