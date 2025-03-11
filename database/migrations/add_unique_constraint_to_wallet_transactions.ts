import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'wallet_transactions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.unique(['reference'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(['reference'])
    })
  }
}
