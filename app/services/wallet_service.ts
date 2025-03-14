import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import Wallet from '#models/wallet'
import WalletTransaction from '#models/wallet_transaction'
import { DateTime } from 'luxon'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import EmailService from '#services/email_service'
import User from '#models/user'

@inject()
export default class WalletService {
  constructor(private emailService: EmailService) {}

  async processTransaction({
    userId,
    amount,
    type,
    reference,
    description,
    metadata,
    paymentMethod = 'paystack',
    trx,
  }: {
    userId: number
    amount: number
    type: 'credit' | 'debit'
    reference: string
    description: string
    metadata: any
    paymentMethod?: string
    trx?: TransactionClientContract
  }) {
    const processWithTransaction = async (transactionClient: TransactionClientContract) => {
      // Get or create wallet with transaction lock
      let wallet = await Wallet.query({ client: transactionClient })
        .where('user_id', Number(userId))
        .forUpdate()
        .first()

      console.log({ wallet })

      if (!wallet) {
        wallet = await Wallet.create(
          {
            user_id: Number(userId),
            balance: 0,
            currency: 'NGN',
            status: 'active',
          },
          { client: transactionClient }
        )
        console.log('UPDATED WALLET', wallet.toJSON())
      }

      // Check for existing transaction to prevent duplicates
      const existingTransaction = await WalletTransaction.query({ client: transactionClient })
        .where('reference', reference)
        .first()

      if (existingTransaction) {
        console.log('Transaction already exists:', existingTransaction.toJSON())
        // Instead of throwing error, return the existing transaction and wallet
        return { wallet, transaction: existingTransaction }
      }

      // Validate balance for debit transactions
      if (type === 'debit' && wallet.balance < amount) {
        throw new Error('Insufficient funds')
      }

      const balanceBefore = Number(wallet.balance || 0)
      const balanceAfter =
        type === 'credit' ? balanceBefore + Number(amount) : balanceBefore - Number(amount)

      console.log('Wallet transaction details:', {
        balanceBefore,
        balanceAfter,
        amount: Number(amount),
        type,
        walletId: wallet.id,
      })

      // Create transaction record
      const transaction = await WalletTransaction.create(
        {
          wallet_id: wallet.id,
          amount: Number(amount),
          type,
          reference,
          description,
          status: 'completed',
          payment_method: paymentMethod,
          metadata,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
        },
        { client: transactionClient }
      )

      // Update wallet balance using direct query to ensure transaction is used
      const updateResult = await Wallet.query({ client: transactionClient })
        .where('id', wallet.id)
        .update({
          balance: balanceAfter,
          updated_at: DateTime.now(),
        })

      console.log('Wallet update result:', { updateResult })

      // Fetch the updated wallet
      const updatedWallet = await Wallet.query({ client: transactionClient })
        .where('id', wallet.id)
        .firstOrFail()

      console.log('Updated wallet:', updatedWallet.toJSON())

      // Send email notification
      const user = await User.find(userId)
      if (user) {
        await this.emailService.sendWalletUpdateNotification(user, transaction)
      }

      return { wallet: updatedWallet, transaction }
    }

    // If a transaction is provided, use it; otherwise create a new one
    if (trx) {
      return await processWithTransaction(trx)
    } else {
      // eslint-disable-next-line @typescript-eslint/no-shadow
      return await db.transaction(async (trx) => {
        return await processWithTransaction(trx)
      })
    }
  }
}
