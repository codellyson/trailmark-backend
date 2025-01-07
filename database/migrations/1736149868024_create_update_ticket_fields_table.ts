import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'events'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.json('ticket_options').defaultTo(JSON.stringify({}))
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('ticket_options')
      table.dropColumn('ticket_price')
      table.dropColumn('ticket_name')
      table.dropColumn('ticket_description')
      table.dropColumn('ticket_capacity')
      table.dropColumn('early_bird')
      table.dropColumn('early_bird_price')
      table.dropColumn('early_bird_end')
      table.dropColumn('ticket_type')
      table.dropColumn('ticket_currency')
      table.dropColumn('ticket_currency_symbol')
    })
  }
}
