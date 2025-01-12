import type { HttpContext } from '@adonisjs/core/http'
import Event from '#models/event'
import Addon from '#models/addon'
import EscrowAccount from '#models/escrow_account'
import { DateTime } from 'luxon'

export default class PhotographerJobsController {
  /**
   * Accept or reject a photography addon job
   */
  async respondToJob({ params, auth, request, response }: HttpContext) {
    const { status, message } = request.only(['status', 'message'])

    // Find the photography addon
    const addon = await Addon.query()
      .where('id', params.addonId)
      .where('type', 'photography')
      .where('photographer_id', auth.user!.id)
      .preload('event')
      .firstOrFail()

    // Verify addon is for photography and assigned to this photographer
    if (addon.type !== 'photography' || addon.photographer_id !== auth.user!.id) {
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
      if (status === 'accepted') {
        addon.status = 'active'
        // Create escrow for the photography service
        await EscrowAccount.create({
          event_id: addon.event_id,
          photographer_id: auth.user!.id,
          amount: addon.price,
          status: 'held',
          held_at: DateTime.now(),
          release_date: addon.event.end_date,
          metadata: {
            addon_id: addon.id,
            accepted_at: DateTime.now(),
            photo_count: addon.photo_count,
            message,
          },
        })
      } else {
        addon.status = 'inactive'
        addon.photographer_id = null // Remove photographer assignment
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

    const addon = await Addon.query()
      .where('id', params.addonId)
      .where('type', 'photography')
      .where('photographer_id', auth.user!.id)
      .where('status', 'active')
      .firstOrFail()

    try {
      // Update escrow status
      const escrow = await EscrowAccount.findByOrFail('event_id', addon.event_id)
      escrow.status = 'released'
      escrow.metadata = {
        ...escrow.metadata,
        completed_at: DateTime.now(),
        deliverables,
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

    const query = Addon.query()
      .where('type', 'photography')
      .where('photographer_id', auth.user!.id)
      .preload('event')
      .preload('escrow')
      .orderBy('created_at', 'desc')

    if (status) {
      query.where('status', status)
    }

    const services = await query.paginate(page, limit)

    return response.json({
      success: true,
      data: services,
      error: null,
    })
  }
}
