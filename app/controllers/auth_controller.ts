import User from '#models/user'
import Wallet from '#models/wallet'
import EmailService from '#services/email_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import hash from '@adonisjs/core/services/hash'
import { updatePasswordValidator, updateUserValidator } from '#validators/auth'
import { PaymentService } from '#services/payment_service'
import { DateTime } from 'luxon'

const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    password: vine.string().minLength(8),
  })
)

const registerValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    password: vine.string().minLength(8),
    first_name: vine.string().minLength(2),
    last_name: vine.string().minLength(2),
    role: vine.enum(['user', 'vendor']),
  })
)

@inject()
export default class AuthController {
  constructor(
    private emailService: EmailService,
    private paymentService: PaymentService
  ) {}

  /**
   * Handle user login
   */
  async login({ request, response }: HttpContext) {
    const payload = await request.validateUsing(loginValidator)

    try {
      const user = await User.findBy('email', payload.email)
      if (!user) {
        return response.unauthorized({
          success: false,
          data: null,
          error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' },
          meta: { timestamp: new Date().toISOString() },
        })
      }

      const verified = await hash.verify(user.password, payload.password)
      console.log(user.password, payload.password, verified)
      if (!verified) {
        return response.unauthorized({
          success: false,
          data: null,
          error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' },
          meta: { timestamp: new Date().toISOString() },
        })
      }

      await user.load('wallet')
      // await user.load('vendor')

      const token = await User.accessTokens.create(user)
      return response.json({
        success: true,
        data: {
          token: token.value?.release(),
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
          },
        },
        error: null,
        meta: { timestamp: new Date().toISOString() },
      })
    } catch (error) {
      console.log(error)
      return response.badRequest({
        success: false,
        data: null,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
        meta: { timestamp: new Date().toISOString() },
      })
    }
  }

  /**
   * Handle user registration
   */
  async register({ request, response }: HttpContext) {
    const payload = await request.validateUsing(registerValidator)

    try {
      // Check if user already exists
      const existingUser = await User.findBy('email', payload.email)
      if (existingUser) {
        return response.badRequest({
          success: false,
          data: {
            email: payload.email,
          },
          error: {
            code: 'EMAIL_TAKEN',
            message: 'Email is already registered',
          },
          meta: { timestamp: new Date().toISOString() },
        })
      }

      // Create new user - let the model handle password hashing
      const user = await User.create({
        email: payload.email,
        password: payload.password,
        first_name: payload.first_name,
        last_name: payload.last_name,
        role: payload.role,
      })

      // Generate access token
      const token = await User.accessTokens.create(user)

      // Setup wallet for vendors and organizers
      const userWallet = await Wallet.findBy('user_id', user.id)
      if (user.role === 'vendor' && !userWallet) {
        await Wallet.setupWallet(user.id)
      }

      // Send welcome email
      await this.emailService.sendWelcome(user)

      return response.json({
        success: true,
        data: {
          token: token.value?.release(),
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
          },
        },
        error: null,
        meta: { timestamp: new Date().toISOString() },
      })
    } catch (error) {
      console.log(error)
      return response.internalServerError({
        success: false,
        data: null,
        error: { code: 'INTERNAL_SERVER_ERROR', message: error.message },
        meta: { timestamp: new Date().toISOString() },
      })
    }
  }

  /**
   * Refresh access token
   */
  async refresh({ auth, response }: HttpContext) {
    const user = auth.user!
    const token = await User.accessTokens.create(user)

    return response.json({
      success: true,
      data: {
        token: token.value?.release(),
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
        },
      },
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }

  // Update User
  async updateUser({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(updateUserValidator)

    const user = auth.user!
    user
      .merge({
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email,
        avatar_url: payload.avatar_url,
        bio: payload.bio,
        // @ts-expect-error
        social_links: payload.social_links || {
          instagram: null,
          facebook: null,
          twitter: null,
          linkedin: null,
          youtube: null,
          tiktok: null,
          whatsapp: null,
        },
        business_name: payload.business_name,
        business_description: payload.business_description,
        business_address: payload.business_address,
        business_phone_number: payload.business_phone_number,
        // business_email: payload.business_email,
        business_website: payload.business_website,
        business_category: payload.business_category,
        business_logo: payload.business_logo,
        business_banner: payload.business_banner,
        // @ts-expect-error
        preferences:
          payload.preferences! ||
          {
            receive_email_notifications: false,
            receive_sms_notifications: false,
            receive_push_notifications: false,
            language: 'en',
            currency: 'NGN',
          }!,
      })
      .save()

    return response.json({
      success: true,
      data: user,
    })
  }
  // Update Password
  async updatePassword({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(updatePasswordValidator)

    const currentPassword = payload.current_password
    const newPassword = payload.new_password
    const user = auth.user!
    const userDetails = await User.find(user.id)

    if (!userDetails) {
      return response.unauthorized({
        success: false,
        data: null,
        error: { code: 'UNAUTHORIZED', message: 'User not found' },
        meta: { timestamp: new Date().toISOString() },
      })
    }

    // compare the current password with the user's password
    const unhashedPassword = await hash.verify(userDetails.password, currentPassword)
    if (!unhashedPassword) {
      return response.unauthorized({
        success: false,
        data: null,
        error: { code: 'UNAUTHORIZED', message: 'Invalid current password' },
        meta: { timestamp: new Date().toISOString() },
      })
    }

    // check if the new password is the same as the current password
    if (newPassword === currentPassword) {
      return response.badRequest({
        success: false,
        data: null,
        error: {
          code: 'BAD_REQUEST',
          message: 'New password cannot be the same as the current password',
        },
        meta: { timestamp: new Date().toISOString() },
      })
    }

    userDetails.password = newPassword
    await userDetails.save()

    // Send password change notification
    await this.emailService.sendPasswordChangeNotification(userDetails)

    return response.json({ success: true })
  }

  // Get User
  async getUser({ auth, response }: HttpContext) {
    const user = auth.user!
    return response.json({
      success: true,
      data: user,
    })
  }

  async setupPaymentDetails({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const setupPaymentValidatorFn = vine.compile(
        vine.object({
          account_name: vine.string(),
          account_number: vine.string(),
          bank_code: vine.string(),
        })
      )

      const payload = await request.validateUsing(setupPaymentValidatorFn)

      // Create Paystack subaccount
      const subaccountResponse = await this.paymentService.generatePaystackSubaccount({
        business_name: user.business_name!,
        account_number: payload.account_number,
        bank_code: payload.bank_code,
        percentage_charge: 0.1,
      })

      // Update user with payment settings
      await user
        .merge({
          business_name: user.business_name!,
          business_address: user.business_address!,
          business_phone_number: user.business_phone_number!,
          payment_settings: {
            paystack_subaccount_code: subaccountResponse.data.subaccount_code,
            paystack_subaccount_name: user.business_name!,
            paystack_subaccount_phone: user.business_phone_number!,
            paystack_subaccount_address: user.business_address!,
          },
        })
        .save()

      return response.json({
        success: true,
        data: {
          message: 'Payment details set up successfully',
          user: user,
        },
        error: null,
        meta: { timestamp: DateTime.now().toISO() },
      })
    } catch (error) {
      console.error('Error setting up payment details:', error)
      return response.internalServerError({
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to set up payment details',
          details: error.message,
        },
        meta: { timestamp: DateTime.now().toISO() },
      })
    }
  }

  async removePaymentDetails({ auth, response }: HttpContext) {
    try {
      const user = auth.user!
      await user
        .merge({
          payment_settings: null,
        })
        .save()

      return response.json({
        success: true,
        data: {
          message: 'Payment details removed successfully',
        },
      })
    } catch (error) {
      console.error('Error removing payment details:', error)
      return response.internalServerError({
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to remove payment details',
          details: error.message,
        },
        meta: { timestamp: DateTime.now().toISO() },
      })
    }
  }
}
