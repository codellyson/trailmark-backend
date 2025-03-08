import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'ticket_custom_questions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('event_id').references('events.id').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('event_id')
    })
  }
}
