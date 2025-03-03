import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tickets'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('name').notNullable()
      table.decimal('price', 10, 2).notNullable()
      table.integer('quantity_sold').unsigned().defaultTo(0)
      table.enum('type', ['free', 'paid', 'invite-only']).defaultTo('paid')
      table.text('description').nullable()
      table.json('perks').defaultTo('[]')
      table.integer('group_size').unsigned().nullable()
      table.integer('event_id').references('id').inTable('events').onDelete('CASCADE')
      table.integer('user_id').references('id').inTable('users').onDelete('CASCADE')
      table.enum('quantity', ['limited', 'unlimited']).defaultTo('limited')
      table.integer('limit').unsigned().nullable()
      table.json('custom_questions').defaultTo('[]')
      table.enum('refund_policy', ['non-refundable', 'flexible']).defaultTo('non-refundable')
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
