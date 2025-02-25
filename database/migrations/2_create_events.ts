import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'events'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Relations
      table
        .integer('organizer_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .notNullable()

      // Basic Info
      table.string('title').notNullable()
      table.text('description').notNullable()
      table.string('slug').unique().notNullable()
      table.integer('capacity').unsigned().nullable()
      table.enum('visibility', ['public', 'private', 'unlisted']).defaultTo('public')

      // Time & Location
      table.date('date').notNullable()
      table.string('start_time').notNullable()
      table.string('end_time').notNullable()
      table.string('timezone').notNullable().defaultTo('UTC')
      table.string('location').notNullable()
      table.jsonb('venue_details').defaultTo('{}')
      table.jsonb('geo_location').defaultTo('{}')

      // Event Type & Status
      table.enum('event_type', ['online', 'offline', 'hybrid']).defaultTo('offline')
      table.enum('status', ['draft', 'published', 'cancelled', 'completed']).defaultTo('draft')

      // Media & Assets
      table.jsonb('thumbnails').defaultTo('[]')
      table.jsonb('gallery').defaultTo('[]')
      table.jsonb('attachments').defaultTo('[]')

      // Event Configuration
      table.jsonb('ticket_options').defaultTo('[]')
      table.jsonb('add_ons').defaultTo('{}')
      table.jsonb('waiver').defaultTo('{}')
      table.boolean('requires_approval').defaultTo(false)
      table.boolean('allows_waitlist').defaultTo(true)
      table.integer('waitlist_limit').nullable()

      // Social & Sharing
      table.boolean('social_sharing_enabled').defaultTo(true)
      table.jsonb('social_sharing_options').defaultTo('{}')
      table.jsonb('custom_social_meta').defaultTo('{}')

      // Analytics & Metrics
      table.integer('views_count').defaultTo(0)
      table.integer('shares_count').defaultTo(0)
      table.integer('bookings_count').defaultTo(0)
      table.jsonb('analytics_data').defaultTo('{}')

      // Timestamps
      table.timestamp('published_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
