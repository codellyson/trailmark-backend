import { BaseSeeder } from '@adonisjs/lucid/seeders'
import VendorService from '#models/vendor_service'
import User from '#models/user'

export default class extends BaseSeeder {
  async run() {
    // Get vendor users
    const johnVendor = await User.findBy('email', 'john@vendor.com')
    const janeVendor = await User.findBy('email', 'jane@vendor.com')

    if (johnVendor) {
      await VendorService.createMany([
        {
          name: 'Full Event Planning',
          description: 'Complete event planning and coordination services',
          price: 500000,
          price_type: 'fixed' as const,
          category: 'Event Planning',
          user_id: johnVendor.id,
          status: 'active' as const,
        },
        {
          name: 'Day-of Coordination',
          description: 'Professional coordination services for your event day',
          price: 200000,
          price_type: 'fixed' as const,
          category: 'Event Planning',
          user_id: johnVendor.id,
          status: 'active' as const,
        },
      ])
    }

    if (janeVendor) {
      await VendorService.createMany([
        {
          name: 'Premium Catering Package',
          description: 'High-end catering service for up to 200 guests',
          price: 5000,
          price_type: 'per_person' as const,
          category: 'Catering',
          user_id: janeVendor.id,
          status: 'active' as const,
        },
        {
          name: 'Basic Catering Package',
          description: 'Quality catering service for up to 100 guests',
          price: 3000,
          price_type: 'per_person' as const,
          category: 'Catering',
          user_id: janeVendor.id,
          status: 'active' as const,
        },
      ])
    }
  }
}
