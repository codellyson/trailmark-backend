import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'events'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // theme_settings: {
      //   template: "default",
      //   primary_color: "#FF5733",
      //   secondary_color: "#33FF57",
      //   font_family: "Inter",
      //   hero_layout: "default",
      //   show_countdown: true,
      // },

      table.jsonb('theme_settings').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('theme_settings')
    })
  }
}
