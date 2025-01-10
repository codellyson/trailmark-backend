import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { compose } from '@adonisjs/core/helpers'
import hash from '@adonisjs/core/services/hash'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  static accessTokens = DbAccessTokensProvider.forModel(User)

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare first_name: string | null

  @column()
  declare last_name: string | null

  @column()
  declare avatar_url: string | null

  @column()
  declare bio: string | null

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare role: 'user' | 'photographer' | 'organizer' | 'admin'

  @column()
  declare phone_number: string | null

  @column()
  declare business_name: string | null

  @column()
  declare business_address: string | null

  @column()
  declare business_phone_number: string | null

  @column()
  declare business_website: string | null

  @column()
  declare status: 'active' | 'inactive' | 'suspended'

  @column()
  declare email_verified: boolean

  @column()
  declare email_verified_at: DateTime | null

  @column()
  declare remember_me_token: string | null

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
