import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'wallets'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.decimal('balance', 10, 2).defaultTo(0)
      table.string('currency', 3).defaultTo('NGN')
      table.enum('status', ['active', 'frozen', 'suspended']).defaultTo('active')
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
