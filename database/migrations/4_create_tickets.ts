import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tickets'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('name').notNullable()
      table.decimal('price', 10, 2).notNullable()
      table.integer('capacity').unsigned().notNullable()
      table.enum('type', ['general', 'vip', 'early_bird', 'group']).defaultTo('general')
      table.text('description').nullable()
      table.json('perks').defaultTo('[]')
      table.integer('group_size').unsigned().nullable()
      table.integer('tickets_sold').unsigned().defaultTo(0)
      table.integer('event_id').references('id').inTable('events').onDelete('CASCADE')
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
