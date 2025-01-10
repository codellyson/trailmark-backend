import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    // First, drop the existing check constraint
    await this.db.rawQuery(`
      ALTER TABLE users
      DROP CONSTRAINT IF EXISTS users_role_check
    `)

    // Then add the new check constraint with updated roles
    await this.db.rawQuery(`
      ALTER TABLE users
      ADD CONSTRAINT users_role_check
      CHECK (role IN ('user', 'organizer', 'photographer', 'admin'))
    `)
  }

  async down() {
    // Revert back to original roles in down migration
    await this.db.rawQuery(`
      ALTER TABLE users
      DROP CONSTRAINT IF EXISTS users_role_check
    `)

    await this.db.rawQuery(`
      ALTER TABLE users
      ADD CONSTRAINT users_role_check
      CHECK (role IN ('user', 'organizer', 'admin'))
    `)
  }
}
