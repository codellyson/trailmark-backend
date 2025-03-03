import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { errors } from '@adonisjs/core'

export default class VendorMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user
    if (!user || !user.role || user.role !== 'vendor') {
      throw new errors.E_UNAUTHORIZED_ACCESS('Vendor access required')
    }

    return next()
  }
}
