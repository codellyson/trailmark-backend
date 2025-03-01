import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'events'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('title').notNullable()
      table.text('description').notNullable()
      table.string('custom_url').unique().notNullable()
      table.string('event_category').notNullable()
      table.enum('event_type', ['offline', 'online', 'hybrid']).defaultTo('offline')
      table.enum('event_frequency', ['single', 'recurring']).defaultTo('single')
      table.date('start_date').notNullable()
      table.date('end_date').notNullable()
      table.string('start_time').notNullable()
      table.string('end_time').notNullable()
      table.string('timezone').notNullable()
      table.string('location').notNullable()
      table.integer('capacity').unsigned()
      table.enum('status', ['draft', 'published']).defaultTo('draft')

      // Theme settings as JSON
      table.json('theme_settings').defaultTo(
        JSON.stringify({
          template: 'default',
          primary_color: '#FF5733',
          secondary_color: '#33FF57',
          font_family: 'Inter',
          hero_layout: 'default',
          show_countdown: true,
        })
      )

      // Social details as JSON
      table.json('social_details').defaultTo(
        JSON.stringify({
          website_url: '',
          instagram_handle: '',
          twitter_handle: '',
          audiomack_url: '',
          facebook_url: '',
        })
      )

      // Thumbnails as JSON array
      table.json('thumbnails').defaultTo('[]')

      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
