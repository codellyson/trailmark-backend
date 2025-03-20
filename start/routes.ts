import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
const MiscallenousController = () => import('#controllers/miscallenous_controller')
const AuthController = () => import('#controllers/auth_controller')
const EventsController = () => import('#controllers/events_controller')
const WebhooksController = () => import('#controllers/webhooks_controller')
const WalletsController = () => import('#controllers/wallets_controller')
const StatsController = () => import('#controllers/stats_controller')
const VendorsController = () => import('#controllers/vendors_controller')
const SocialSharingController = () => import('#controllers/social_sharing_controller')
const PaymentsController = () => import('#controllers/payments_controller')
const AdminController = () => import('#controllers/admin_controller')
const NotificationsController = () => import('#controllers/notifications_controller')

// Health check endpoint (must be at root level for Railway)
router.get('/health', async () => {
  return { status: 'healthy' }
})

router.get('/', () => 'Hello World').prefix('/api/v1')

router
  .group(() => {
    // Auth routes
    router.post('/auth/login', [AuthController, 'login'])
    router.post('/auth/register', [AuthController, 'register'])
    router.post('/auth/refresh', [AuthController, 'refresh']).use(middleware.auth())
  })
  .prefix('/api/v1')

router
  .group(() => {
    router.post('/events/:eventId/quick-vendor-payment-link', [
      VendorsController,
      'generateQuickVendorPaymentLink',
    ])
  })
  .prefix('/api/v1')

// Protected Auth Routes
router
  .group(() => {
    router.put('/auth/update-profile', [AuthController, 'updateUser']).use(middleware.auth())
    router.put('/auth/update-password', [AuthController, 'updatePassword']).use(middleware.auth())
    router.get('/auth/profile', [AuthController, 'getUser']).use(middleware.auth())
  })
  .prefix('/api/v1')
  .use(middleware.auth())

// Event Routes
router
  .group(() => {
    router.get('/events', [EventsController, 'getEvents']).use(middleware.auth())
    router.get('/events/upcoming', [EventsController, 'getUpcomingEvents']).use(middleware.auth())
    router.put('/events/:id', [EventsController, 'updateEvent']).use(middleware.auth())
    router.get('/events/:id', [EventsController, 'getEvent']).use(middleware.auth())
    router.get('/events/public/:id', [EventsController, 'getPublicEvent'])
    router.post('/events', [EventsController, 'createEvent']).use(middleware.auth())
    router.delete('/events/:id', [EventsController, 'deleteEvent']).use(middleware.auth())
    router.post('/events/:id/vendor-applications', [EventsController, 'createVendorApplication'])
    router.get('/events/:id/vendor-applications', [EventsController, 'getVendorApplications'])
    router.post('/events/:id/vendor-express-interest', [VendorsController, 'vendorExpressInterest'])

    // router
    //   .post('/events/:id/tickets', [EventsController, 'createEventTicket'])
    //   .use(middleware.auth())
  })

  .prefix('/api/v1')

// Event Ticket routes
router
  .group(() => {
    router.get('/events/:eventId', [EventsController, 'getEvent']).use(middleware.auth())

    router
      .post('/events/:eventId/tickets', [EventsController, 'createEventTicket'])
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

    // pay for ticket
    router.post('/events/:eventId/tickets/pay', [EventsController, 'payForTicket'])
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
    router.get('/payments/list-of-banks', [PaymentsController, 'listOfBanks'])
    router.post('/payments/verify-account-number', [PaymentsController, 'verifyAccountNumber'])
  })
  .prefix('/api/v1')

// Wallet routes
router
  .group(() => {
    // Common routes
    router.get('/wallet', [WalletsController, 'getWallet'])
    router.get('/wallet/transactions', [WalletsController, 'getTransactions'])
    router.post('/payment/setup', [AuthController, 'setupPaymentDetails'])
    router.delete('/payment/remove', [AuthController, 'removePaymentDetails'])
  })
  .prefix('/api/v1')
  .use(middleware.auth())

router
  .group(() => {
    router.get('/analytics/user', [StatsController, 'getDashboardStats'])
  })
  .prefix('/api/v1')
  .use(middleware.auth())

// Vendor routes
router
  .group(() => {
    // Public routes
    router.get('public/vendors', [VendorsController, 'index'])
    router.get('vendors/services/search', [VendorsController, 'searchByServices'])
    router.get('vendors/listing', [VendorsController, 'vendorListing'])
    router.post('/vendors/:vendorId/payment-link/verify', [
      VendorsController,
      'verifyVendorPaymentLink',
    ])

    // Protected routes
    router
      .group(() => {
        router.group(() => {
          router.get('/vendors/services', [VendorsController, 'getVendorServices'])
          router.post('/vendors/services', [VendorsController, 'createVendorService'])

          // vendor events
          router.get('/vendors/connected-events', [VendorsController, 'getVendorConnectedEvents'])
          router.get('/vendors/events/upcoming', [VendorsController, 'getVendorUpcomingEvents'])
          router.get('/vendors/events/past', [VendorsController, 'getPastEvents'])
          router.put('/vendors/services/:id', [VendorsController, 'updateVendorService'])
          router.delete('/vendors/services/:id', [VendorsController, 'deleteVendorService'])
          router.get('/vendors/events/:id', [VendorsController, 'getVendorEvent'])
        })
      })
      .use(middleware.auth())
      .use(middleware.vendor())

    router
      .group(() => {
        router.get('/vendors', [VendorsController, 'getAllVendors'])
        router.get('/vendors/connected-vendors', [VendorsController, 'getConnectedVendors'])
        router.get('/vendors/favorites', [VendorsController, 'getFavoriteVendors'])
        router.post('/vendors/:id/favorite', [VendorsController, 'toggleFavoriteVendor'])
        router.post('/vendors/:serviceId/payment-link', [VendorsController, 'generatePaymentLink'])
      })
      .use(middleware.auth())

    // .use(middleware.admin())
  })
  .prefix('/api/v1')

// Social sharing routes
router
  .group(() => {
    router.get('/events/:id/share-links', [SocialSharingController, 'getShareLinks'])
    router.get('/events/:id/preview-card', [SocialSharingController, 'getPreviewCard'])
    router.post('/events/:id/share', [SocialSharingController, 'shareEvent'])
    router.get('/events/:id/qr-code', [SocialSharingController, 'generateQR'])
  })
  .prefix('/api/v1')

router.group(() => {
  router.get('/events/upcoming', [EventsController, 'getUpcomingEvents'])
})

// Admin Routes
router
  .group(() => {
    router.put('/users/:id/status', [AdminController, 'updateUserStatus'])
  })
  .prefix('/api/v1/admin')
  .use(middleware.auth())
  .use(async (ctx, next) => {
    const user = ctx.auth.user
    if (!user || user.role !== 'admin') {
      return ctx.response.forbidden({
        success: false,
        data: null,
        error: { code: 'FORBIDDEN', message: 'Admin access required' },
        meta: { timestamp: new Date().toISOString() },
      })
    }
    await next()
  })

// Notification routes
router
  .group(() => {
    router.post('/notifications/subscribe', [NotificationsController, 'subscribe'])
    router.post('/notifications/unsubscribe', [NotificationsController, 'unsubscribe'])
  })
  .prefix('/api/v1')
  .use(middleware.auth())
