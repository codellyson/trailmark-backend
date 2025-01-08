// import type { HttpContext } from '@adonisjs/core/http'

import { cuid } from '@adonisjs/core/helpers'
import drive from '@adonisjs/drive/services/main'
import { HttpContext } from '@adonisjs/core/http'

export default class MiscallenousController {
  async uploadImage({ request, response }: HttpContext) {
    const file = request.file('image', {
      size: '2mb',
      extnames: ['jpg', 'jpeg', 'png'],
    })

    if (!file) {
      return response.badRequest({
        success: false,
        data: null,
        error: { code: 'INVALID_REQUEST', message: 'No image provided' },
        meta: { timestamp: new Date().toISOString() },
      })
    }

    const key = `uploads/${cuid()}.${file.extname}`
    await file.moveToDisk(key)

    const url = await drive.use().getUrl(key)

    return {
      success: true,
      data: {
        url: url,
        key: key,
      },
      error: null,
      meta: { timestamp: new Date().toISOString() },
    }
  }
  async deleteImage({ request, response }: HttpContext) {
    const key = request.input('key')
    await drive.use().delete(key)
    return response.ok({
      success: true,
      data: null,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }
}
