import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Basic Info
      table.string('first_name').notNullable()
      table.string('last_name').notNullable()
      table.string('email').unique().notNullable()
      table.string('phone').unique().nullable()
      table.string('password').notNullable()

      // Profile
      table.text('bio').nullable()
      table.string('avatar_url').nullable()
      table.jsonb('social_links').defaultTo('{}')

      // Verification & Status
      table.boolean('is_email_verified').defaultTo(false)
      table.boolean('is_phone_verified').defaultTo(false)
      table.enum('status', ['active', 'inactive', 'suspended']).defaultTo('active')
      table.string('verification_token').nullable()
      table.timestamp('email_verified_at').nullable()

      // Preferences
      table.jsonb('notification_preferences').defaultTo('{}')
      table.string('timezone').defaultTo('UTC')
      table.string('language').defaultTo('en')

      // Role & Permissions
      table.enum('role', ['user', 'organizer', 'admin']).defaultTo('user')
      table.jsonb('permissions').defaultTo('[]')

      // Remember Me Token
      table.string('remember_me_token').nullable()

      // Timestamps
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.timestamp('last_login_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
