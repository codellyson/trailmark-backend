import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'addons'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.jsonb('revenue_share').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('revenue_share')
    })
  }
}
