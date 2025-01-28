import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { compose } from '@adonisjs/core/helpers'
import hash from '@adonisjs/core/services/hash'
import { BaseModel, column, SnakeCaseNamingStrategy, hasOne, hasMany } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import type { HasOne, HasMany } from '@adonisjs/lucid/types/relations'
import Wallet from './wallet.js'
import PhotographyService from './photography_service.js'
import EscrowAccount from './escrow_account.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})
BaseModel.namingStrategy = new SnakeCaseNamingStrategy()
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

  @column()
  declare preferences: Record<string, any>

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime | null

  @hasOne(() => Wallet, {
    foreignKey: 'user_id',
  })
  declare wallet: HasOne<typeof Wallet>

  @hasMany(() => PhotographyService, {
    foreignKey: 'photographer_id',
    onQuery(query) {
      query.preload('event', (_query) => _query.preload('organizer'))
      query.preload('photographer')
      query.preload('addon')
    },
  })
  declare services: HasMany<typeof PhotographyService>

  @hasMany(() => EscrowAccount, {
    foreignKey: 'photographer_id',
  })
  declare escrow: HasMany<typeof EscrowAccount>
}
