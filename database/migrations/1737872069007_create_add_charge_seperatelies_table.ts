import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'addons'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('charge_seperately').defaultTo(false)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('charge_seperately')
    })
  }
}
