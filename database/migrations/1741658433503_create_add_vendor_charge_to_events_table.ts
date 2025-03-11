import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'events'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.decimal('vendor_charge', 10, 2).defaultTo(0)
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('vendor_charge')
    })
  }
}
