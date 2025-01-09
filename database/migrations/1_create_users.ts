import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Basic Info
      table.string('email').notNullable().unique()
      table.string('password').notNullable()
      table.string('first_name').notNullable()
      table.string('last_name').notNullable()
      table.string('phone_number').nullable()
      table.string('business_name').nullable()
      table.string('business_address').nullable()
      table.string('business_phone_number').nullable()
      table.string('business_website').nullable()

      // Profile & Settings
      table.string('avatar_url').nullable()
      table.text('bio').nullable()
      table.jsonb('preferences').defaultTo('{}')

      // Role & Status
      table.enum('role', ['user', 'organizer', 'admin']).defaultTo('user')
      table.enum('status', ['active', 'inactive', 'suspended']).defaultTo('active')

      // Verification
      table.boolean('email_verified').defaultTo(false)
      table.timestamp('email_verified_at').nullable()
      table.string('remember_me_token').nullable()

      // Timestamps
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
