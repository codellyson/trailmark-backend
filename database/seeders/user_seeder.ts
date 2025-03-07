import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'

export default class extends BaseSeeder {
  async run() {
    // Create admin user
    await User.create({
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@trailmark.com',
      password: 'Password123!',
      role: 'admin' as const,
      status: 'active' as const,
      is_email_verified: true,
      phone: '+2348012345678',
    })

    // Create vendor users
    const vendors = [
      {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@vendor.com',
        password: 'Password123!',
        role: 'vendor' as const,
        status: 'active' as const,
        is_email_verified: true,
        phone: '+2348012345679',
        business_name: 'John Events',
        business_category: 'Event Planning',
        business_description: 'Professional event planning services',
        business_address: 'Lagos, Nigeria',
        business_phone_number: '+2348012345680',
        business_website: 'https://johnevents.com',
        social_links: {
          instagram: '@johnevents',
          facebook: 'johnevents',
          twitter: '@johnevents',
          whatsapp: '+2348012345680',
          linkedin: null,
          youtube: null,
          tiktok: null,
        },
      },
      {
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@vendor.com',
        password: 'Password123!',
        role: 'vendor' as const,
        status: 'active' as const,
        is_email_verified: true,
        phone: '+2348012345681',
        business_name: 'Jane Catering',
        business_category: 'Catering',
        business_description: 'Premium catering services',
        business_address: 'Abuja, Nigeria',
        business_phone_number: '+2348012345682',
        business_website: 'https://janecatering.com',
        social_links: {
          instagram: '@janecatering',
          facebook: 'janecatering',
          twitter: '@janecatering',
          whatsapp: '+2348012345682',
          linkedin: null,
          youtube: null,
          tiktok: null,
        },
      },
    ]

    await User.createMany(vendors)

    // Create regular users
    const users = [
      {
        first_name: 'Regular',
        last_name: 'User',
        email: 'user@example.com',
        password: 'Password123!',
        role: 'user' as const,
        status: 'active' as const,
        is_email_verified: true,
        phone: '+2348012345683',
      },
      {
        first_name: 'Alice',
        last_name: 'Johnson',
        email: 'alice@example.com',
        password: 'Password123!',
        role: 'user' as const,
        status: 'active' as const,
        is_email_verified: true,
        phone: '+2348012345684',
      },
    ]

    await User.createMany(users)
  }
}
