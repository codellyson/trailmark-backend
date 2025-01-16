import type { HttpContext } from '@adonisjs/core/http'
import Event from '#models/event'
import Addon from '#models/addon'
import EscrowAccount from '#models/escrow_account'
import { DateTime } from 'luxon'
import PhotographyService from '#models/photography_service'

export default class PhotographerJobsController {
  /**
   * Accept or reject a photography addon job
   */
  async respondToJob({ params, auth, request, response }: HttpContext) {
    const { status, message } = request.only(['status', 'message'])

    // Find the photography addon
    const addon = await PhotographyService.query()
      .where('addon_id', params.addonId)
      .where('photographer_id', auth.user!.id)
      .preload('event')
      .firstOrFail()

    if (addon.photographer_id !== auth.user!.id) {
      return response.forbidden({
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You are not assigned to this photography service',
        },
      })
    }

    try {
      // Update addon status
      switch (status) {
        case 'accepted':
          addon.status = 'accepted'
          addon.accepted_at = DateTime.now()

          const escrow = await EscrowAccount.create({
            event_id: addon.event_id,
            photographer_id: addon.photographer_id,
            amount: addon.price,
            status: 'held',
            held_at: DateTime.now(),
            release_date: addon.event_date,
            metadata: {
              addon_id: addon.id,
              accepted_at: DateTime.now().toISO(),
              photo_count: addon.photo_count,
              message,
            },
          })
          break
        case 'rejected':
          addon.status = 'rejected'
          break
        case 'in_progress':
          addon.status = 'in_progress'
          break
        case 'delivered':
          addon.status = 'delivered'
          addon.delivered_at = DateTime.now()
          break
        case 'cancelled':
          addon.status = 'cancelled'
          break
      }
      await addon.save()

      return response.json({
        success: true,
        data: {
          addon,
          message: `Photography service ${status} successfully`,
        },
        error: null,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        data: null,
        error: {
          code: 'PROCESSING_ERROR',
          message: 'Failed to process photography service response',
          details: error.message,
        },
      })
    }
  }

  /**
   * Mark photography service as completed
   */
  async markServiceCompleted({ params, auth, request, response }: HttpContext) {
    const { deliverables } = request.only(['deliverables'])

    console.log(deliverables)

    const addon = await PhotographyService.query()
      .where('addon_id', params.addonId)
      .where('photographer_id', auth.user!.id)
      .where('status', 'delivered')
      .firstOrFail()

    try {
      // Update escrow status
      const escrow = await EscrowAccount.findByOrFail('event_id', addon.event_id)
      escrow.status = 'released'
      escrow.metadata = {
        ...escrow.metadata,
        completed_at: DateTime.now().toISO(),
        deliverables,
        photo_count: deliverables.length,
      }
      await escrow.save()

      return response.json({
        success: true,
        data: {
          addon,
          escrow,
          message: 'Photography service marked as completed successfully',
        },
        error: null,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        data: null,
        error: {
          code: 'PROCESSING_ERROR',
          message: 'Failed to mark service as completed',
          details: error.message,
        },
      })
    }
  }

  /**
   * Get photographer's assigned services
   */
  async getAssignedServices({ auth, request, response }: HttpContext) {
    const { status, page = 1, limit = 10 } = request.qs()

    const query = PhotographyService.query()
      .where('photographer_id', auth.user!.id)
      .preload('event', (_query) => _query.preload('organizer'))
      .preload('photographer')
      .preload('addon')
      // .preload('escrow')
      .orderBy('created_at', 'desc')

    if (status) {
      query.where('status', status)
    }

    const services = await query.paginate(page, limit)

    return response.json({
      success: true,
      data: services || [],
      error: null,
    })
  }
}
