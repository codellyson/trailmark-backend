import Photo from '#models/photo'
import PhotoGallery from '#models/photo_gallery'
import {
  deleteGalleryValidator,
  deletePhotoValidator,
  getGalleryValidator,
  updateGalleryValidator,
  uploadPhotosValidator,
} from '#validators/photo'
import { createGalleryValidator } from '#validators/photo_gallery'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class PhotosController {
  // Create gallery
  async createGallery({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(createGalleryValidator)

    if (auth.user?.role !== 'photographer') {
      return response.forbidden({
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to create a gallery',
        },
      })
    }

    const gallery = await PhotoGallery.create({
      eventId: payload.eventId,
      bookingId: payload.bookingId,
      galleryType: payload.bookingId ? 'booking_private' : 'event_private',
    })

    return response.json({
      success: true,
      data: gallery,
    })
  }

  // Update gallery (e.g., changing from private to public for event galleries)
  async updateGallery({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(updateGalleryValidator)
    const routePayload = await request.validateUsing(getGalleryValidator)
    const gallery = await PhotoGallery.findOrFail(routePayload.id)

    if (auth.user?.role !== 'photographer') {
      return response.forbidden({
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to update this gallery',
        },
      })
    }

    // Only allow updating event galleries (not booking galleries)
    if (gallery.galleryType === 'booking_private') {
      return response.forbidden({
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Booking galleries cannot be updated',
        },
      })
    }

    gallery.merge({ galleryType: payload.galleryType })
    await gallery.save()

    return response.json({
      success: true,
      data: gallery,
    })
  }

  // Add/Upload photos
  async uploadPhotos({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(uploadPhotosValidator)

    if (auth.user?.role !== 'photographer') {
      return response.forbidden({
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to upload photos',
        },
      })
    }

    const photos = []

    for (const photo of payload.photos) {
      const filePath = `photos/${payload.eventId}/${photo.fileName}`

      const photoRecord = await Photo.create({
        eventId: payload.eventId,
        bookingId: payload.bookingId,
        photographerId: auth.user?.id,
        filePath,
        takenAt: DateTime.now(),
        status: 'pending',
        uploadedAt: DateTime.now(),
      })

      photos.push(photoRecord)
    }

    return response.json({
      success: true,
      data: photos,
    })
  }

  // Get gallery/photos
  async getGallery({ request, response, auth }: HttpContext) {
    if (auth.user?.role !== 'photographer') {
      return response.forbidden({
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to get this gallery',
        },
      })
    }

    const payload = await request.validateUsing(getGalleryValidator)
    const gallery = await PhotoGallery.findOrFail(payload.id)

    return response.json({
      success: true,
      data: gallery,
    })
  }

  // Delete gallery
  async deleteGallery({ request, response, auth }: HttpContext) {
    if (auth.user?.role !== 'photographer') {
      return response.forbidden({
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to delete this gallery',
        },
      })
    }

    const payload = await request.validateUsing(deleteGalleryValidator)
    const gallery = await PhotoGallery.findOrFail(payload.id)

    await gallery.delete()

    return response.json({
      success: true,
    })
  }

  // Delete photo
  async deletePhoto({ request, response, auth }: HttpContext) {
    if (auth.user?.role !== 'photographer') {
      return response.forbidden({
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to delete this photo',
        },
      })
    }

    const payload = await request.validateUsing(deletePhotoValidator)
    const photo = await Photo.findOrFail(payload.id)

    await photo.delete()

    return response.json({
      success: true,
    })
  }
}
