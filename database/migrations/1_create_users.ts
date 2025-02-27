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
      table.string('avatar_url').nullable()
      table.text('bio').nullable()
      table.jsonb('social_links').defaultTo('{}')

      // Role & Status
      table.enum('role', ['user', 'vendor', 'admin']).defaultTo('user')
      table.enum('status', ['active', 'inactive', 'suspended']).defaultTo('active')

      // Business Info (formerly organizer info)
      table.string('business_name').nullable()
      table.text('business_description').nullable()
      table.string('business_address').nullable()
      table.string('business_phone_number').nullable()
      table.string('business_email').nullable()
      table.string('business_website').nullable()
      table.string('tax_id').nullable()
      table.string('registration_number').nullable()
      table.boolean('is_business_verified').defaultTo(false)
      table.timestamp('business_verified_at').nullable()

      // Verification
      table.boolean('is_email_verified').defaultTo(false)
      table.boolean('is_phone_verified').defaultTo(false)
      table.string('verification_token').nullable()
      table.timestamp('email_verified_at').nullable()

      // Preferences & Settings
      table.jsonb('preferences').defaultTo('{}')
      table.jsonb('payment_settings').defaultTo('{}')
      table.jsonb('commission_settings').defaultTo('{}')
      table.jsonb('permissions').defaultTo('{}')
      table.string('timezone').defaultTo('UTC')
      table.string('language').defaultTo('en')

      // Metrics
      table.integer('total_events').defaultTo(0)
      table.integer('active_events').defaultTo(0)
      table.decimal('total_revenue', 10, 2).defaultTo(0)
      table.integer('total_attendees').defaultTo(0)

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
