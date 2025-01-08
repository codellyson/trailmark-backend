import type { HttpContext } from '@adonisjs/core/http'

export default class WebhooksController {
  async squadWebhook(ctx: HttpContext) {
    console.log(ctx.request.body())
  }
}
