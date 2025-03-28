import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'vendor_services'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.jsonb('images').defaultTo('[]')
      table.decimal('price', 10, 2).notNullable()
      table.string('price_type').notNullable()
      table.string('description').notNullable()
      table.string('category').notNullable()
      table.enum('status', ['active', 'inactive']).defaultTo('active')
      table.integer('user_id').references('users.id').notNullable()
      table.jsonb('features').defaultTo('[]')
      table.timestamps(true, true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
