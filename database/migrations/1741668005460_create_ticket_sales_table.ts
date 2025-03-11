import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'ticket_sales'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // References
      table.integer('ticket_id').unsigned().references('id').inTable('tickets').onDelete('RESTRICT')
      table.integer('event_id').unsigned().references('id').inTable('events').onDelete('RESTRICT')
      table.integer('buyer_id').unsigned().references('id').inTable('users').onDelete('RESTRICT')
      table.string('payment_reference').notNullable()

      // Sale details
      table.integer('quantity').notNullable()
      table.decimal('amount_paid', 10, 2).notNullable()
      table.decimal('platform_fee', 10, 2).notNullable()
      table.jsonb('custom_answers').nullable()

      // Status tracking
      table
        .enum('status', ['pending', 'completed', 'cancelled', 'refunded', 'transferred'])
        .defaultTo('pending')

      // Metadata
      table.jsonb('metadata').nullable()

      // Timestamps
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      // Indexes
      table.index(['ticket_id', 'status'])
      table.index(['buyer_id', 'status'])
      table.index('payment_reference')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
