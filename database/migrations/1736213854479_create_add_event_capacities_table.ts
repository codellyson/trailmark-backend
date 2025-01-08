import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'events'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('capacity').unsigned().nullable()
      table.jsonb('thumbnails').defaultTo('[]')
      table.string('slug').unique().nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('capacity')
      table.dropColumn('thumbnails')
      table.dropColumn('slug')
    })
  }
}
