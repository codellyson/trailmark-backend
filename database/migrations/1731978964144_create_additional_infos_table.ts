import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'additional_infos'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').references('id').inTable('users').onDelete('CASCADE')
      table.string('bio').nullable()
      table.string('website').nullable()
      table.string('instagram').nullable()
      table.string('facebook').nullable()
      table.string('twitter').nullable()
      table.string('youtube').nullable()
      table.string('tiktok').nullable()
      table.string('linkedin').nullable()
      table.string('pinterest').nullable()
      table.string('snapchat').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
