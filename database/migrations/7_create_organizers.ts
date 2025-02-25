import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'organizers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // User Relation
      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .notNullable()
        .unique()

      // Organization Info
      table.string('organization_name').nullable()
      table.text('organization_description').nullable()
      table.string('website').nullable()
      table.string('organization_email').nullable()
      table.string('organization_phone').nullable()

      // Address
      table.string('address_line1').nullable()
      table.string('address_line2').nullable()
      table.string('city').nullable()
      table.string('state').nullable()
      table.string('postal_code').nullable()
      table.string('country').nullable()

      // Legal & Verification
      table.string('tax_id').nullable()
      table.string('registration_number').nullable()
      table.boolean('is_verified').defaultTo(false)
      table.timestamp('verified_at', { useTz: true }).nullable()
      table.jsonb('verification_documents').defaultTo('[]')

      // Settings & Preferences
      table.jsonb('event_categories').defaultTo('[]')
      table.jsonb('payment_details').defaultTo('{}')
      table.jsonb('commission_settings').defaultTo('{}')
      table.jsonb('organizer_permissions').defaultTo('[]')

      // Metrics
      table.integer('total_events').defaultTo(0)
      table.integer('active_events').defaultTo(0)
      table.decimal('total_revenue', 10, 2).defaultTo(0)
      table.integer('total_attendees').defaultTo(0)

      // Timestamps
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
