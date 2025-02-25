import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import Event from '#models/event'
import SocialSharingService from '#services/social_sharing_service'
import { errors } from '@adonisjs/core'

@inject()
export default class SocialSharingController {
  constructor(protected socialSharingService: SocialSharingService) {}

  /**
   * Get social sharing links for an event
   */
  public async getShareLinks({ params, response }: HttpContext) {
    const event = await Event.findOrFail(params.id)
    const shareLinks = await this.socialSharingService.generateShareLinks(event)
    return response.ok(shareLinks)
  }

  /**
   * Get social preview card metadata for an event
   */
  public async getPreviewCard({ params, response }: HttpContext) {
    const event = await Event.findOrFail(params.id)
    const previewCard = await this.socialSharingService.generatePreviewCard(event)
    return response.ok(previewCard)
  }

  /**
   * Share an event on social media
   */
  public async shareEvent({ params, request, response }: HttpContext) {
    const event = await Event.findOrFail(params.id)
    const { platform, customMessage } = request.only(['platform', 'customMessage'])

    if (!['facebook', 'twitter', 'whatsapp', 'instagram'].includes(platform)) {
      throw new errors.E_HTTP_EXCEPTION('Invalid social media platform', {
        code: 'E_INVALID_SOCIAL_MEDIA_PLATFORM',
        status: 400,
      })
    }

    const result = await this.socialSharingService.shareEvent(event, {
      platform,
      customMessage,
    })

    return response.ok(result)
  }

  /**
   * Generate QR code for an event
   */
  public async generateQR({ params, response }: HttpContext) {
    const event = await Event.findOrFail(params.id)
    const qrCode = await this.socialSharingService.generateEventQR(event)
    return response.ok(qrCode)
  }

  /**
   * Update social share metadata for an event
   */
  public async updateShareMetadata({ params, response }: HttpContext) {
    const event = await Event.findOrFail(params.id)
    const metadata = await this.socialSharingService.updateSocialShareMetadata(event)
    return response.ok(metadata)
  }
}
