import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'
import { createUserValidator } from '#validators/user'
import vine from '@vinejs/vine'

const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    password: vine.string().minLength(8),
  })
)

export default class AuthController {
  /**
   * Handle user login
   */
  async login({ request, response }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    const user = await User.verifyCredentials(email, password)
    const token = await User.accessTokens.create(user)

    return response.json({
      success: true,
      data: {
        user,
        token: token.value,
      },
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }

  /**
   * Handle user registration
   */
  async register({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createUserValidator)

    const user = await User.create({
      email: payload.email,
      password: payload.password,
      first_name: payload.first_name,
      last_name: payload.last_name,
      role: payload.role,
      status: 'active', // Default status for new users
    })

    const token = await User.accessTokens.create(user)

    return response.json({
      success: true,
      data: {
        user,
        token: token.value,
      },
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
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

  async me({ response, auth }: HttpContext) {
    const user = auth.user!

    return response.json({
      success: true,
      data: user,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }

  async logout({ response, auth }: HttpContext) {
    await auth.use('api').logout()

    return response.json({
      success: true,
      data: null,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }
}
