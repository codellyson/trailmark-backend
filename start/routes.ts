import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
const MiscallenousController = () => import('#controllers/miscallenous_controller')
const EventAddOnsController = () => import('#controllers/event_addons_controller')
const AuthController = () => import('#controllers/auth_controller')
const EventsController = () => import('#controllers/events_controller')
const PhotosController = () => import('#controllers/photos_controller')
const BookingsController = () => import('#controllers/bookings_controller')
const WebhooksController = () => import('#controllers/webhooks_controller')
const PhotographersController = () => import('#controllers/photographers_controller')
const WalletsController = () => import('#controllers/wallets_controller')
const EventPaymentsController = () => import('#controllers/event_payments_controller')
const EscrowController = () => import('#controllers/escrow_controller')
const PhotographerJobsController = () => import('#controllers/photographer_jobs_controller')
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
    router.post('/events', [EventsController, 'createEvent']).use(middleware.auth())
    router.delete('/events/:id', [EventsController, 'deleteEvent']).use(middleware.auth())
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
  })
  .prefix('/api/v1')

// Event Add-on routes
// router
//   .group(() => {
//     router.post('/event-add-ons', [EventAddOnsController, 'addAddOnToEvent']).use(middleware.auth())
//     router.get('/event-add-ons/:eventId', [EventAddOnsController, 'getAddOnsForEvent'])
//     router
//       .put('/event-add-ons/:id', [EventAddOnsController, 'updateAddOnForEvent'])
//       .use(middleware.auth())
//     router
//       .delete('/event-add-ons/:id', [EventAddOnsController, 'removeAddOnFromEvent'])
//       .use(middleware.auth())
//   })
//   .prefix('/api/v1')

// // Event Photographers routes
// router
//   .group(() => {
//     router
//       .post('/event-photographers', [EventPhotographersController, 'addPhotographerToEvent'])
//       .use(middleware.auth())
//     router.get('/event-photographers/:eventId', [
//       EventPhotographersController,
//       'getPhotographersForEvent',
//     ])
//     router
//       .put('/event-photographers/:id', [
//         EventPhotographersController,
//         'updateEventPhotographerStatus',
//       ])
//       .use(middleware.auth())
//     router
//       .delete('/event-photographers/:id', [
//         EventPhotographersController,
//         'removePhotographerFromEvent',
//       ])
//       .use(middleware.auth())
//   })
//   .prefix('/api/v1')

// Booking routes
router
  .group(() => {
    router.post('/bookings', [BookingsController, 'createBooking']).use(middleware.auth())
    router.get('/bookings/:id', [BookingsController, 'getBooking']).use(middleware.auth())
    router.put('/bookings/:id', [BookingsController, 'updateBooking']).use(middleware.auth())
    router.delete('/bookings/:id', [BookingsController, 'deleteBooking']).use(middleware.auth())
    router
      .post('/bookings/:id/add-ons', [BookingsController, 'createBookingAddOn'])
      .use(middleware.auth())
  })
  .prefix('/api/v1')

// Photo routes
router
  .group(() => {
    router.post('/galleries', [PhotosController, 'createGallery']).use(middleware.auth())
    router.delete('/photos/:id', [PhotosController, 'deletePhoto']).use(middleware.auth())
    router.get('/galleries/:galleryId', [PhotosController, 'getGallery']).use(middleware.auth())
    router.put('/galleries/:galleryId', [PhotosController, 'updateGallery']).use(middleware.auth())

    router
      .delete('/galleries/:galleryId', [PhotosController, 'deleteGallery'])
      .use(middleware.auth())

    router.post('/photos', [PhotosController, 'uploadPhotos']).use(middleware.auth())
  })

  .prefix('/api/v1')

// Payment routes
router
  .group(() => {
    router
      .post('/payments/create-intent', '#controllers/payments_controller.createIntent')
      .use(middleware.auth())

    router.post('/payments/webhook', '#controllers/payments_controller.webhook')
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
    router.post('/webhooks/squad', [WebhooksController, 'squadWebhook'])
  })
  .prefix('/api/v1')

// Photographers routes
router
  .group(() => {
    // Protected routes - require authentication
    router
      .group(() => {
        router.get('/profile', [PhotographersController, 'getPhotographerProfile'])
        router.put('/profile', [PhotographersController, 'updateProfile'])
        router.get('/wallet', [PhotographersController, 'getPhotographerWallet'])
      })
      .use(middleware.auth())

    // Public routes
    router.get('/', [PhotographersController, 'getPhotographers'])
    router.get('/:id', [PhotographersController, 'getPhotographer'])
  })
  .prefix('/api/v1/photographers')

// Wallet routes
router
  .group(() => {
    // Common routes
    router.get('/wallet', [WalletsController, 'getWallet'])
    router.get('/wallet/transactions', [WalletsController, 'getTransactions'])

    // Photographer-specific routes
    router
      .group(() => {
        router.post('/wallet/payout-request', [WalletsController, 'requestPhotographerPayout'])
        router.get('/wallet/pending-events', [WalletsController, 'getPendingEvents'])
        router.get('/wallet/earnings', [WalletsController, 'getPhotographerEarnings'])
      })
      .use(middleware.auth())

    // Organizer-specific routes
  })
  .prefix('/api/v1')

// Event payments routes or checkout
router
  .group(() => {
    router.post('/events/:eventId/payments', [EventPaymentsController, 'processPayment'])
    router.get('/events/payments/:id', [EventPaymentsController, 'getPayment'])
  })
  .prefix('/api/v1')

// Escrow routes
router
  .group(() => {
    router.post('/events/:eventId/escrow/release', [EscrowController, 'releaseToPhotographer'])
    router.get('/events/:eventId/escrow', [EscrowController, 'getEventEscrow'])
  })
  .prefix('/api/v1')
  .use(middleware.auth())

// Photography Service API Endpoints
router
  .group(() => {
    router.post('/addons/:addonId/photographer/respond', [
      PhotographerJobsController,
      'respondToJob',
    ])
    router.post('/addons/:addonId/photographer/complete', [
      PhotographerJobsController,
      'markServiceCompleted',
    ])
    router.get('/photographer/services', [PhotographerJobsController, 'getAssignedServices'])

    // Payment API Endpoints
    router.post('/events/payments', [EventPaymentsController, 'processPayment'])
    router.get('/photographer/earnings', [WalletsController, 'getPhotographerEarnings'])
  })
  .prefix('/api/v1')
  .use(middleware.auth())
