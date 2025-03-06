import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'events'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.jsonb('social_metrics').defaultTo(
        JSON.stringify({
          facebook: { shares: 0, views: 0, clicks: 0 },
          twitter: { shares: 0, views: 0, clicks: 0 },
          instagram: { shares: 0, views: 0, clicks: 0 },
          whatsapp: { shares: 0, views: 0, clicks: 0 },
        })
      )
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('social_metrics')
    })
  }
}
