import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'events'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('confirmation_message').nullable()
      table.jsonb('event_sale_status').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('confirmation_message')
      table.dropColumn('event_sale_status')
    })
  }
}
