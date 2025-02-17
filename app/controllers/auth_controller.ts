import User from '#models/user'
import Wallet from '#models/wallet'
import EmailService from '#services/email_service'
import { inject } from '@adonisjs/core/container'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'

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
    role: vine.enum(['organizer', 'photographer', 'user']),
  })
)

@inject()
export default class AuthController {
  constructor(private emailService: EmailService) {}
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
      const token = await User.accessTokens.create(user)
      const userWallet = await Wallet.findBy('user_id', user.id)

      if (user.role === 'photographer' && !userWallet) {
        await Wallet.setupWallet(user.id)
      }

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

      // Create new user
      const user = await User.create({
        email: payload.email,
        password: payload.password,
        first_name: payload.first_name,
        last_name: payload.last_name,
        role: payload.role,
      })

      // Generate access token
      const token = await User.accessTokens.create(user)

      const userWallet = await Wallet.findBy('user_id', user.id)
      if ((user.role === 'photographer' || user.role === 'organizer') && !userWallet) {
        await Wallet.setupWallet(user.id)
      }
      console.log(user.email!, user.first_name!)
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
      return response.badRequest({
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
}
