import env from '#start/env'
import Event from '#models/event'
import { generateQRCode } from './qr_code_service.js'

interface ShareOptions {
  platform: 'facebook' | 'twitter' | 'whatsapp' | 'instagram'
  customMessage?: string
}

export default class SocialSharingService {
  /**
   * Generate social media share links for an event
   */
  public async generateShareLinks(event: Event) {
    const eventUrl = `${env.get('APP_URL')}/events/${event.custom_url || event.id}`
    const encodedUrl = encodeURIComponent(eventUrl)
    const encodedTitle = encodeURIComponent(event.title)
    const encodedDescription = encodeURIComponent(event.description)

    return {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      // Instagram doesn't support direct sharing via URL, but we can copy the link
      instagram: eventUrl,
      url: eventUrl,
    }
  }

  /**
   * Generate social media preview card metadata for an event
   */
  public async generatePreviewCard(event: Event) {
    const eventUrl = `${env.get('APP_URL')}/events/${event.custom_url || event.id}`
    const thumbnailUrl = event.thumbnails?.[0]?.url || ''

    return {
      title: event.title,
      description: event.description,
      image: thumbnailUrl,
      url: eventUrl,
      // Open Graph metadata
      og: {
        title: event.title,
        description: event.description,
        image: thumbnailUrl,
        url: eventUrl,
        type: 'website',
        site_name: env.get('APP_NAME', 'NaijaEvents'),
      },
      // Twitter Card metadata
      twitter: {
        card: 'summary_large_image',
        title: event.title,
        description: event.description,
        image: thumbnailUrl,
      },
    }
  }

  /**
   * Share an event on social media and track metrics
   */
  public async shareEvent(event: Event, options: ShareOptions) {
    const { platform, customMessage } = options

    // Generate share link
    const shareLinks = await this.generateShareLinks(event)
    const shareUrl = shareLinks[platform]

    // Update social metrics
    const metrics = event.social_metrics ?? {
      facebook: { shares: 0, views: 0, clicks: 0 },
      twitter: { shares: 0, views: 0, clicks: 0 },
      instagram: { shares: 0, views: 0, clicks: 0 },
      whatsapp: { shares: 0, views: 0, clicks: 0 },
    }

    if (!metrics[platform]) {
      metrics[platform] = { shares: 0, views: 0, clicks: 0 }
    }

    metrics[platform].shares += 1
    await event.merge({ social_metrics: metrics }).save()

    return {
      shareUrl,
      metrics: event.social_metrics,
    }
  }

  /**
   * Generate a QR code for sharing the event
   */
  public async generateEventQR(event: Event) {
    const eventUrl = `${env.get('APP_URL')}/events/${event.custom_url || event.id}`
    return await generateQRCode(eventUrl)
  }

  /**
   * Update event's social share metadata
   */
}
