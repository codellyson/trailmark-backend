import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { errors } from '@adonisjs/core'

export default class AdminMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user

    if (!user || !user.role || user.role !== 'admin') {
      throw new errors.E_UNAUTHORIZED_ACCESS('Admin access required')
    }

    return next()
  }
}
