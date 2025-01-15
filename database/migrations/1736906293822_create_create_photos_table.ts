import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'photos'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Core relationships
      table
        .integer('event_id')
        .unsigned()
        .references('id')
        .inTable('events')
        .onDelete('CASCADE')
        .notNullable()

      table
        .integer('photography_service_id')
        .unsigned()
        .references('id')
        .inTable('photography_services')
        .onDelete('CASCADE')
        .notNullable()

      // Photo details
      table.string('url').notNullable()
      table.string('thumbnail_url').nullable()
      table.string('original_filename').nullable()
      table.string('mime_type').nullable()
      table.integer('size_in_bytes').nullable()
      table.integer('width').nullable()
      table.integer('height').nullable()

      // Photo metadata
      table.jsonb('metadata').defaultTo('{}') // For EXIF data, camera info, etc.

      // Status and visibility
      table.enum('status', ['uploading', 'processing', 'ready', 'failed']).defaultTo('uploading')

      table.boolean('is_public').defaultTo(false)
      table.boolean('is_featured').defaultTo(false)

      // Timestamps
      table.timestamp('taken_at').nullable()
      table.timestamp('uploaded_at').notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      // Indexes for common queries
      table.index(['event_id', 'status'])
      table.index(['photography_service_id', 'status'])
      table.index('taken_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
