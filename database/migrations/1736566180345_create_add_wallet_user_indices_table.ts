import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'wallets'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Add unique index to ensure one wallet per user
      table.unique(['user_id'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(['user_id'])
    })
  }
}
