import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'auth_access_tokens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Token Info
      table.string('type').notNullable()
      table.string('name').nullable()
      table.string('hash').notNullable().unique()
      table.text('abilities').nullable()

      // Relations
      table
        .integer('tokenable_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .notNullable()

      // Expiry & Usage
      table.timestamp('expires_at', { useTz: true }).nullable()
      table.timestamp('last_used_at', { useTz: true }).nullable()

      // Timestamps
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      // Indexes
      table.index(['tokenable_id', 'type'])
      table.index(['hash'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
