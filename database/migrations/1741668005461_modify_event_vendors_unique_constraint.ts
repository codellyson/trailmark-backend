import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'event_vendors'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Drop the existing unique constraint
      table.dropUnique(['event_id', 'vendor_id'])

      // Add new unique constraint including service_id
      table.unique(['event_id', 'vendor_id', 'service_id'])
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Drop the new unique constraint
      table.dropUnique(['event_id', 'vendor_id', 'service_id'])

      // Restore the original unique constraint
      table.unique(['event_id', 'vendor_id'])
    })
  }
}
