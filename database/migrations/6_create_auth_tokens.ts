import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'auth_tokens'

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

      // Token Info
      table.string('type').notNullable()
      table.string('name').nullable()
      table.string('token').unique().notNullable()
      table.text('abilities').nullable()

      // Device & Location
      table.string('device_type').nullable()
      table.string('device_name').nullable()
      table.string('ip_address').nullable()
      table.string('location').nullable()
      table.jsonb('device_details').defaultTo('{}')

      // Status & Security
      table.boolean('is_revoked').defaultTo(false)
      table.timestamp('last_used_at', { useTz: true }).nullable()
      table.timestamp('revoked_at', { useTz: true }).nullable()
      table.string('revoked_by_ip').nullable()
      table.text('revocation_reason').nullable()

      // Expiry
      table.timestamp('expires_at', { useTz: true }).nullable()

      // Timestamps
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
