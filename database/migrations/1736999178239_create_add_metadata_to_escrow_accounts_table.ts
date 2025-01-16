import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'escrow_accounts'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Add metadata column as JSONB
      table.jsonb('metadata').defaultTo('{}')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('metadata')
    })
  }
}
