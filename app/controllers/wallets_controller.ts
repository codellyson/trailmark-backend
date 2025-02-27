import type { HttpContext } from '@adonisjs/core/http'
import Wallet from '#models/wallet'
import Event from '#models/event'
import WalletTransaction from '#models/wallet_transaction'
export default class WalletsController {
  /**
   * Get user wallet
   */
  async getWallet({ auth, response }: HttpContext) {
    const wallet = await Wallet.firstOrCreate(
      { user_id: auth.user!.id },
      {
        user_id: auth.user!.id,
        available_balance: 0,
        pending_balance: 0,
        total_earnings: 0,
      }
    )

    return response.json({
      success: true,
      data: wallet,
      error: null,
    })
  }

  /**
   * Get wallet transactions
   */
  async getTransactions({ auth, request, response }: HttpContext) {
    const { page = 1, limit = 10 } = request.qs()

    const wallet = await Wallet.findByOrFail('user_id', auth.user!.id)
    const transactions = await wallet
      .related('transactions')
      .query()
      .orderBy('createdAt', 'desc')
      .paginate(page, limit)

    return response.json({
      success: true,
      data: transactions,
      error: null,
    })
  }

  /**
   * Request photographer payout
   */
  async requestPhotographerPayout({ auth, request, response }: HttpContext) {
    const { amount, payoutMethod } = request.only(['amount', 'payoutMethod'])
    const wallet = await Wallet.findByOrFail('user_id', auth.user!.id)

    if (!wallet.hasSufficientBalance(amount)) {
      return response.badRequest({
        success: false,
        data: null,
        error: {
          message: 'Insufficient balance',
        },
      })
    }

    const transaction = await wallet.addTransaction({
      type: 'payout_request',
      amount: -amount,
      status: 'pending',
      metadata: {
        payoutMethod,
        requestedAt: new Date().toISOString(),
      },
    })

    return response.json({
      success: true,
      data: transaction,
      error: null,
    })
  }

  /**
   * Get photographer earnings
   */
  async getPhotographerEarnings({ auth, response }: HttpContext) {
    const wallet = await Wallet.findByOrFail('user_id', auth.user!.id)

    const earnings = {
      total_earnings: wallet.total_earnings,
      available_balance: wallet.available_balance,
      pending_balance: wallet.pending_balance,
      recent_transactions: await wallet
        .related('transactions')
        .query()
        .orderBy('createdAt', 'desc')
        .limit(5),
    }

    return response.json({
      success: true,
      data: earnings,
      error: null,
    })
  }

  /**
   * Get pending events (for photographers)
   */
  async getPendingEvents({ auth, response }: HttpContext) {
    const pendingEvents = await Event.query()
      .where('photographer_id', auth.user!.id)
      .where('status', 'pending')
      .preload('escrow_accounts' as any) // Type assertion to fix type error

    return response.json({
      success: true,
      data: pendingEvents,
      error: null,
    })
  }

  // Get user wallet
  async getUserWallet({ auth, response }: HttpContext) {
    try {
      const wallet = await Wallet.query().where('user_id', auth.user!.id).firstOrFail()
      wallet.load('transactions')
      return response.json({
        success: true,
        data: wallet,
        error: null,
      })
    } catch (error) {
      console.error('Error getting user wallet:', error)
      return response.internalServerError({
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching the wallet',
        },
      })
    }
  }

  // Get user wallet transactions
  async getUserTransactions({ auth, response }: HttpContext) {
    try {
      console.log(auth.user!.id, 'auth.user!.id')
      const wallet = await Wallet.query().where('user_id', auth.user!.id).firstOrFail()
      const walletTransactions = await wallet.related('transactions').query()
      const eventId = walletTransactions.map((transaction) => transaction.metadata.event_id)!
      const events = await Event.findMany(eventId)
      const newTransactions = walletTransactions.map((transaction) => {
        const matchedEvent = events.find(
          (event) => Number(event.id) === Number(transaction.metadata?.event_id)
        )
        return {
          ...transaction.serialize(),
          event: matchedEvent,
        }
      })
      return response.json({
        success: true,
        data: newTransactions,
        error: null,
      })
    } catch (error) {
      console.error('Error getting user wallet:', error)
      return response.internalServerError({
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching the wallet',
        },
      })
    }
  }
}
