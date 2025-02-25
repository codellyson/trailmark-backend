import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'vendors'

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

      // Basic Info
      table.string('business_name').notNullable()
      table.text('description').nullable()
      table.string('business_email').notNullable()
      table.string('business_phone').nullable()
      table.string('website').nullable()

      // Business Details
      table.string('tax_id').nullable()
      table.string('registration_number').nullable()
      table.jsonb('business_hours').defaultTo('{}')
      table.jsonb('service_areas').defaultTo('[]')
      table
        .enum('business_type', [
          'food',
          'merchandise',
          'services',
          'entertainment',
          'equipment',
          'other',
        ])
        .defaultTo('other')

      // Address & Location
      table.string('address_line1').nullable()
      table.string('address_line2').nullable()
      table.string('city').nullable()
      table.string('state').nullable()
      table.string('postal_code').nullable()
      table.string('country').nullable()
      table.jsonb('geo_location').defaultTo('{}')

      // Financial Information
      table.jsonb('payment_details').defaultTo('{}')
      table.decimal('commission_rate', 5, 2).nullable()
      table.string('currency').defaultTo('USD')
      table.jsonb('banking_information').defaultTo('{}')

      // Verification & Status
      table.boolean('is_verified').defaultTo(false)
      table.timestamp('verified_at', { useTz: true }).nullable()
      table.enum('status', ['pending', 'active', 'suspended', 'inactive']).defaultTo('pending')
      table.jsonb('verification_documents').defaultTo('[]')

      // Media & Display
      table.string('logo_url').nullable()
      table.jsonb('gallery').defaultTo('[]')
      table.jsonb('social_media_links').defaultTo('{}')
      table.text('terms_and_conditions').nullable()

      // Categories & Services
      table.jsonb('categories').defaultTo('[]')
      table.jsonb('services_offered').defaultTo('[]')
      table.jsonb('products_offered').defaultTo('[]')
      table.jsonb('pricing_tiers').defaultTo('[]')

      // Insurance & Compliance
      table.boolean('has_insurance').defaultTo(false)
      table.date('insurance_expiry').nullable()
      table.jsonb('certifications').defaultTo('[]')
      table.jsonb('compliance_documents').defaultTo('[]')

      // Metrics & Analytics
      table.integer('total_events').defaultTo(0)
      table.decimal('total_revenue', 10, 2).defaultTo(0)
      table.integer('rating_count').defaultTo(0)
      table.decimal('average_rating', 3, 2).defaultTo(0)
      table.jsonb('analytics_data').defaultTo('{}')

      // Timestamps
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.timestamp('last_active_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
