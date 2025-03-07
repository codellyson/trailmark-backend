import { BaseSeeder } from '@adonisjs/lucid/seeders'
import UserSeeder from './user_seeder.js'
import VendorServiceSeeder from './vendor_service_seeder.js'
import EventSeeder from './event_seeder.js'

export default class extends BaseSeeder {
  async run() {
    await new UserSeeder(this.client).run()
    await new VendorServiceSeeder(this.client).run()
    await new EventSeeder(this.client).run()
  }
}
