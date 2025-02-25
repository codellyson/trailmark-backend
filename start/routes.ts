import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
const MiscallenousController = () => import('#controllers/miscallenous_controller')
const AuthController = () => import('#controllers/auth_controller')
const EventsController = () => import('#controllers/events_controller')
const BookingsController = () => import('#controllers/bookings_controller')
const WebhooksController = () => import('#controllers/webhooks_controller')
const WalletsController = () => import('#controllers/wallets_controller')
const StatsController = () => import('#controllers/stats_controller')
const VendorsController = () => import('#controllers/vendors_controller')
const SocialSharingController = () => import('#controllers/social_sharing_controller')
router.get('/', () => 'Hello World').prefix('/api/v1')

router
  .group(() => {
    // Auth routes
    router.post('/auth/login', [AuthController, 'login'])
    router.post('/auth/register', [AuthController, 'register'])
    router.post('/auth/refresh', [AuthController, 'refresh']).use(middleware.auth())
  })
  .prefix('/api/v1')

// Event Routes
router
  .group(() => {
    router.get('/events', [EventsController, 'getEvents'])
    router.put('/events/:id', [EventsController, 'updateEvent']).use(middleware.auth())
    router.get('/events/:id', [EventsController, 'getEvent']).use(middleware.auth())
    router.get('/events/public/:id', [EventsController, 'getPublicEvent'])
    router.post('/events', [EventsController, 'createEvent']).use(middleware.auth())
    router.delete('/events/:id', [EventsController, 'deleteEvent']).use(middleware.auth())
    router
      .get('/generate-apple-ticket-pass/:bookingId', [EventsController, 'generateAppleTicketPass'])
      .use(middleware.auth())
  })
  .prefix('/api/v1')

// Event Ticket routes
router
  .group(() => {
    router
      .post('/events/:eventId/tickets', [EventsController, 'createEventTicket'])
      .use(middleware.auth())

    router
      .post('/events/:eventId/addons', [EventsController, 'createEventAddon'])
      .use(middleware.auth())

    router
      .get('/events/:eventId/tickets', [EventsController, 'getEventTickets'])
      .use(middleware.auth())

    router
      .put('/events/:eventId/tickets', [EventsController, 'updateEventTicket'])
      .use(middleware.auth())

    router
      .delete('/events/:eventId/tickets/:id', [EventsController, 'deleteEventTicket'])
      .use(middleware.auth())

    router
      .put('/events/:eventId/tickets/:id/status', [EventsController, 'updateEventTicketStatus'])
      .use(middleware.auth())
  })
  .prefix('/api/v1')

// Booking routes
router
  .group(() => {
    // Get all bookings (admin only)
    router.get('/bookings', [BookingsController, 'index']).use(middleware.auth())

    // Get user's bookings
    router.get('/user/bookings', [BookingsController, 'userBookings']).use(middleware.auth())

    // Get organizer's event bookings
    router
      .get('/events/:eventId/bookings', [BookingsController, 'organizerEventBookings'])
      .use(middleware.auth())

    // Get booking details
    router.get('/bookings/:id', [BookingsController, 'show']).use(middleware.auth())

    // Get booking statistics
    router
      .get('/events/:eventId/booking-statistics', [BookingsController, 'getStatistics'])
      .use(middleware.auth())
  })
  .prefix('/api/v1')

// Miscallenous routes
router
  .group(() => {
    router.post('/upload-image', [MiscallenousController, 'uploadImage'])
    router.delete('/delete-image', [MiscallenousController, 'deleteImage'])
  })
  .prefix('/api/v1')

// Webhook routes
router
  .group(() => {
    //  payments/webhook/paystack
    router.post('/payments/webhook/paystack', [WebhooksController, 'paystackWebhook'])
  })
  .prefix('/api/v1')

// Wallet routes
router
  .group(() => {
    // Common routes
    router.get('/wallet', [WalletsController, 'getWallet'])
    router.get('/wallet/transactions', [WalletsController, 'getTransactions'])

    // Organizer-specific routes
    router.get('/organizer/wallet', [WalletsController, 'getOrganizerWallet'])
    router.get('/organizer/transactions', [WalletsController, 'getOrganizerTransactions'])
  })
  .prefix('/api/v1')
  .use(middleware.auth())

router
  .group(() => {
    router.get('/analytics/organizer', [StatsController, 'getDashboardStats'])
  })
  .prefix('/api/v1')
  .use(middleware.auth())

// Ticket pass routes
router
  .group(() => {
    router.get('/bookings/:bookingId/passes', [EventsController, 'getTicketPassOptions'])
    router.get('/bookings/:bookingId/apple-pass', [EventsController, 'generateAppleTicketPass'])
    router.get('/bookings/:bookingId/google-pass', [EventsController, 'generateGoogleTicketPass'])
  })

  // .middleware(middleware.auth())
  .prefix('/api/v1')

router
  .group(() => {
    router.get('/bookings/user', [BookingsController, 'userBookings'])
  })
  .use(middleware.auth())
  .prefix('/api/v1')

// Vendor routes
router
  .group(() => {
    // Public routes
    router.get('vendors', [VendorsController, 'index'])
    router.get('vendors/:id', [VendorsController, 'show'])
    router.get('vendors/:id/reviews', [VendorsController, 'getReviews'])
    router.get('vendors/search/services', [VendorsController, 'searchByServices'])

    // Protected routes
    router
      .group(() => {
        router.post('vendors', [VendorsController, 'store'])
        router.put('vendors/:id', [VendorsController, 'update'])
        router.delete('vendors/:id', [VendorsController, 'destroy'])

        // Admin only routes
        router
          .group(() => {
            router.patch('vendors/:id/status', [VendorsController, 'updateStatus'])
          })
          .use(middleware.admin())
      })
      .use(middleware.auth())
  })
  .prefix('/api/v1')

// Social sharing routes
router
  .group(() => {
    router.get('/events/:id/share-links', [SocialSharingController, 'getShareLinks'])
    router.get('/events/:id/preview-card', [SocialSharingController, 'getPreviewCard'])
    router.post('/events/:id/share', [SocialSharingController, 'shareEvent'])
    router.get('/events/:id/qr-code', [SocialSharingController, 'generateQR'])
    router.post('/events/:id/share-metadata', [SocialSharingController, 'updateShareMetadata'])
  })
  .prefix('/api/v1')
