import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import Wallet from '#models/wallet'
import WalletTransaction from '#models/wallet_transaction'
import { DateTime } from 'luxon'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

@inject()
export default class WalletService {
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
      }

      // Check for existing transaction to prevent duplicates
      const existingTransaction = await WalletTransaction.query({ client: transactionClient })
        .where('reference', reference)
        .first()

      if (existingTransaction) {
        throw new Error('Transaction already processed')
      }

      // Validate balance for debit transactions
      if (type === 'debit' && wallet.balance < amount) {
        throw new Error('Insufficient funds')
      }

      const balanceBefore = wallet.balance
      const balanceAfter = type === 'credit' ? wallet.balance + amount : wallet.balance - amount

      // Create transaction record
      const transaction = await WalletTransaction.create(
        {
          wallet_id: wallet.id,
          amount,
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

      // Update wallet balance
      await wallet
        .merge({
          balance: balanceAfter,
          updated_at: DateTime.now(),
        })
        .save()

      return { wallet, transaction }
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
