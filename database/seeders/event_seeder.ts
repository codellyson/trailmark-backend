import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Event from '#models/event'
import User from '#models/user'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    const admin = await User.findBy('email', 'admin@trailmark.com')
    const regularUser = await User.findBy('email', 'user@example.com')

    console.log('Admin user:', admin?.id)
    console.log('Regular user:', regularUser?.id)

    if (admin) {
      const techEvent = await Event.create({
        title: 'Tech Conference 2024',
        description: 'Annual technology conference featuring industry leaders',
        custom_url: 'tech-conference-2024',
        event_category: 'Technology',
        event_type: 'hybrid' as const,
        event_frequency: 'single' as const,
        start_date: DateTime.now().plus({ months: 2 }),
        end_date: DateTime.now().plus({ months: 2, days: 2 }),
        start_time: '09:00',
        end_time: '17:00',
        timezone: 'Africa/Lagos',
        location: 'Eko Convention Center, Lagos',
        capacity: 1000,
        status: 'published' as const,
        user_id: admin.id,
        theme_settings: {
          template: 'modern',
          primary_color: '#2563eb',
          secondary_color: '#1e40af',
          font_family: 'Inter',
          hero_layout: 'centered',
          show_countdown: true,
        },
        social_details: {
          website_url: 'https://techconf2024.com',
          instagram_handle: '@techconf2024',
          twitter_handle: '@techconf2024',
          facebook_url: 'https://facebook.com/techconf2024',
        },
        social_metrics: {
          facebook: { shares: 150, views: 500, clicks: 200 },
          twitter: { shares: 300, views: 1000, clicks: 400 },
          instagram: { shares: 200, views: 800, clicks: 300 },
          whatsapp: { shares: 100, views: 0, clicks: 0 },
        },
        thumbnails: [
          {
            url: 'https://example.com/tech-conf.jpg',
            key: 'tech-conf.jpg',
          },
        ],
      })
      console.log('Created tech event:', techEvent.id)
    }

    if (regularUser) {
      const communityEvent = await Event.create({
        title: 'Community Meetup',
        description: 'Monthly community gathering and networking event',
        custom_url: 'community-meetup',
        event_category: 'Networking',
        event_type: 'offline' as const,
        event_frequency: 'single' as const,
        start_date: DateTime.now().plus({ weeks: 2 }),
        end_date: DateTime.now().plus({ weeks: 2 }),
        start_time: '16:00',
        end_time: '20:00',
        timezone: 'Africa/Lagos',
        location: 'The Good Beach, Lagos',
        capacity: 100,
        status: 'published' as const,
        user_id: regularUser.id,
        theme_settings: {
          template: 'minimal',
          primary_color: '#10b981',
          secondary_color: '#059669',
          font_family: 'Poppins',
          hero_layout: 'split',
          show_countdown: true,
        },
        social_details: {
          website_url: 'https://community-meetup.com',
          instagram_handle: '@communitymeetup',
          twitter_handle: '@communitymeetup',
          facebook_url: 'https://facebook.com/communitymeetup',
        },
        social_metrics: {
          facebook: { shares: 50, views: 200, clicks: 80 },
          twitter: { shares: 100, views: 400, clicks: 150 },
          instagram: { shares: 75, views: 300, clicks: 120 },
          whatsapp: { shares: 30, views: 0, clicks: 0 },
        },
        thumbnails: [
          {
            url: 'https://example.com/meetup.jpg',
            key: 'meetup.jpg',
          },
        ],
      })
      console.log('Created community event:', communityEvent.id)
    }
  }
}
