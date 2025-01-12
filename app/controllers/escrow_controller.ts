import type { HttpContext } from '@adonisjs/core/http'
import EscrowAccount from '#models/escrow_account'
import Wallet from '#models/wallet'
import Event from '#models/event'
import { DateTime } from 'luxon'

export default class EscrowController {
  /**
   * Release funds to photographer after event completion
   */
  async releaseToPhotographer({ params, auth, response }: HttpContext) {
    const escrow = await EscrowAccount.query()
      .where('event_id', params.eventId)
      .where('status', 'held')
      .firstOrFail()

    const event = await Event.findOrFail(params.eventId)

    // Ensure only organizer can release funds
    if (auth.user!.id !== event.organizer_id) {
      return response.forbidden({
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Only the event organizer can release escrow funds',
        },
        meta: { timestamp: new Date().toISOString() },
      })
    }

    // Get or create photographer's wallet
    const photographerWallet = await Wallet.firstOrCreate(
      { user_id: escrow.photographer_id },
      {
        user_id: escrow.photographer_id,
        available_balance: 0,
        pending_balance: 0,
      }
    )

    try {
      // Calculate platform fee (e.g., 10% of photographer fee)
      const platformFee = escrow.amount * 0.1
      const photographerAmount = escrow.amount - platformFee

      // Add funds to photographer's wallet
      await photographerWallet.addTransaction({
        type: 'event_payment_received',
        amount: photographerAmount,
        fee: platformFee,
        status: 'completed',
        reference_type: 'event',
        reference_id: Number(event.id),
        metadata: {
          escrow_id: escrow.id,
          event_id: Number(event.id),
          released_by: auth.user!.id,
          platform_fee: platformFee,
        },
      })

      // Update escrow status
      escrow.status = 'released'
      escrow.released_at = DateTime.now()
      await escrow.save()

      return response.json({
        success: true,
        data: {
          escrow,
          transaction: {
            amount: photographerAmount,
            fee: platformFee,
            total: escrow.amount,
          },
        },
        error: null,
        meta: { timestamp: new Date().toISOString() },
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        data: null,
        error: {
          code: 'RELEASE_FAILED',
          message: 'Failed to release escrow funds',
          details: error.message,
        },
        meta: { timestamp: new Date().toISOString() },
      })
    }
  }

  /**
   * Get escrow details for an event
   */
  async getEventEscrow({ params, auth, response }: HttpContext) {
    const escrow = await EscrowAccount.query().where('event_id', params.eventId).firstOrFail()

    // Only allow organizer or assigned photographer to view escrow
    const event = await Event.findOrFail(params.eventId)
    if (auth.user!.id !== escrow.photographer_id && auth.user!.id !== event.organizer_id) {
      return response.forbidden({
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to view this escrow',
        },
        meta: { timestamp: new Date().toISOString() },
      })
    }

    return response.json({
      success: true,
      data: escrow,
      error: null,
      meta: { timestamp: new Date().toISOString() },
    })
  }
}
