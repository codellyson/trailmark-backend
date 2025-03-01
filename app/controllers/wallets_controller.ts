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
        balance: 0,
        escrow_balance: 0,
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
