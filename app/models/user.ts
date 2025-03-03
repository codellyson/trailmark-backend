import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { BaseModel, column, SnakeCaseNamingStrategy, hasOne, hasMany } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import type { HasOne, HasMany } from '@adonisjs/lucid/types/relations'
import Wallet from './wallet.js'
import Vendor from './event_vendor.js'
import { beforeSave } from '@adonisjs/lucid/orm'
import hash from '@adonisjs/core/services/hash'
import VendorService from './vendor_service.js'

BaseModel.namingStrategy = new SnakeCaseNamingStrategy()

export default class User extends BaseModel {
  static accessTokens = DbAccessTokensProvider.forModel(User)

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare first_name: string | null

  @column()
  declare last_name: string | null

  @column()
  declare wallet_id: number | null

  @column()
  declare avatar_url: string | null

  @column()
  declare bio: string | null

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare role: 'user' | 'vendor' | 'admin'

  @column()
  declare phone_number: string | null

  @column()
  declare business_name: string | null

  @column()
  declare business_address: string | null

  @column()
  declare business_category: string | null

  @column()
  declare business_phone_number: string | null

  @column()
  declare business_website: string | null

  @column()
  declare business_description: string | null

  @column()
  declare business_logo: string | null

  @column()
  declare business_banner: string | null

  @column()
  declare social_links?: {
    instagram: string | null
    facebook: string | null
    twitter: string | null
    linkedin: string | null
    youtube: string | null
    tiktok: string | null
    whatsapp: string | null
  }

  @column()
  declare status: 'active' | 'inactive' | 'suspended'

  @column()
  declare email_verified: boolean

  @column()
  declare email_verified_at: DateTime | null

  @column()
  declare remember_me_token: string | null

  @column()
  declare preferences?: {
    receive_email_notifications: boolean
    receive_sms_notifications: boolean
    receive_push_notifications: boolean
    language: string
    currency: string
  }

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime | null

  @hasOne(() => Wallet, {
    foreignKey: 'user_id',
  })
  declare wallet: HasOne<typeof Wallet>

  @hasMany(() => Vendor, {
    foreignKey: 'user_id',
  })
  declare vendors: HasMany<typeof Vendor>

  @hasOne(() => Vendor, {
    foreignKey: 'user_id',
  })
  declare vendor: HasOne<typeof Vendor>

  @hasMany(() => VendorService, {
    foreignKey: 'user_id',
  })
  declare vendor_services: HasMany<typeof VendorService>

  @hasOne(() => VendorService, {
    foreignKey: 'user_id',
  })
  declare vendor_service: HasOne<typeof VendorService>

  @beforeSave()
  static async hashPassword(user: User) {
    if (user.$dirty.password) {
      user.password = await hash.make(user.password)
    }
  }

  static async isVendor(user: User): Promise<boolean> {
    return user.role === 'vendor'
  }

  static async isAdmin(user: User): Promise<boolean> {
    return user.role === 'admin'
  }
}
